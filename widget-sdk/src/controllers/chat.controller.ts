import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { getScreenFingerprint } from '../lib/Fingerprint.js';


export interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
    timestamp: number;
}

export interface InteractiveElement {
    id: string;
    label: string;
    tag?: string;
}

export interface ChatAction {
    type: 'click_element' | 'navigate' | 'continue' | 'input_text';
    element_id?: string;
    url?: string;
    value?: string;
}

export interface ChatResponse {
    text: string;
    action: ChatAction | null;
}

const API_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:8000';

const MAX_AGENT_STEPS = 5;

export class ChatController implements ReactiveController {
    host: ReactiveControllerHost;

    messages: ChatMessage[] = [];
    isLoading = false;
    error: string | null = null;

    constructor(host: ReactiveControllerHost) {
        (this.host = host).addController(this);
        this._loadMessages();
    }

    hostConnected() {}
    hostDisconnected() {}

    private _loadMessages() {
        try {
            const saved = sessionStorage.getItem('bw-chat-history');
            if (saved) {
                this.messages = JSON.parse(saved);
                if (this.messages.length > 0 && typeof (this.host as any).setOpen === 'function') {
                    setTimeout(() => (this.host as any).setOpen(true), 100);
                }
            }
            
            const autoResume = sessionStorage.getItem('bw-auto-resume');
            if (autoResume === 'true') {
                sessionStorage.removeItem('bw-auto-resume');
                // After a full page navigation, auto-continue the agent task
                setTimeout(() => {
                    this._agentStep("Страница загрузилась. Продолжай выполнение задачи с учетом нового контекста и DOM.");
                }, 1000);
            }
        } catch (e) {
            console.error('Failed to load chat history', e);
        }
    }

    private _saveMessages() {
        try {
            sessionStorage.setItem('bw-chat-history', JSON.stringify(this.messages));
        } catch (e) {
            console.error('Failed to save chat history', e);
        }
    }

    /**
     * Gather page context: page text + interactive elements with IDs.
    /**
     * Gather page context for the AI agent.
     * Elements are returned in a compressed [tag:id:text] string to save tokens.
     */
    gatherContext(): { page_text: string; elements: string; page_url: string } {
        const page_url = window.location.href;
        const page_text = document.body?.innerText?.slice(0, 3000) ?? '';

        const interactiveSelectors = 'a[href], button, [role="button"], input:not([type="hidden"]), textarea, select';
        const rawElements = Array.from(document.querySelectorAll(interactiveSelectors));

        const elements: InteractiveElement[] = rawElements
            .map((el) => {
                const htmlEl = el as HTMLElement;

                // --- STABLE ID GENERATION ---
                // Use explicit ID first, then generate a stable hash from element properties
                // so that DOM re-renders don't break previously assigned IDs.
                let id = htmlEl.id && !htmlEl.getAttribute('data-bw-auto')
                    ? htmlEl.id
                    : htmlEl.getAttribute('data-id') || htmlEl.getAttribute('data-testid') || '';

                if (!id) {
                    // Build a stable fingerprint: tag + class + href/text snippet + parent info
                    const tag = htmlEl.tagName.toLowerCase();
                    const cls = (htmlEl.className || '').toString().replace(/\s+/g, '-').slice(0, 40);
                    const href = (htmlEl as HTMLAnchorElement).href || '';
                    const textSnip = (htmlEl.textContent || '').trim().slice(0, 30);
                    const parentTag = htmlEl.parentElement?.tagName?.toLowerCase() || 'root';
                    const raw = `${tag}|${cls}|${href}|${textSnip}|${parentTag}`;

                    // Simple djb2 hash → short hex string
                    let h = 5381;
                    for (let i = 0; i < raw.length; i++) {
                        h = ((h << 5) + h) ^ raw.charCodeAt(i);
                    }
                    id = `bw-${(h >>> 0).toString(16)}`;
                    htmlEl.id = id;
                    htmlEl.setAttribute('data-bw-auto', 'true');
                }

                let label =
                    htmlEl.getAttribute('aria-label') ||
                    htmlEl.textContent?.trim().slice(0, 100) ||
                    htmlEl.getAttribute('title') ||
                    htmlEl.getAttribute('placeholder') ||
                    '';

                // Add input name/type to label if it's a form element
                if (htmlEl.tagName.toLowerCase() === 'input' || htmlEl.tagName.toLowerCase() === 'textarea') {
                    const name = htmlEl.getAttribute('name') || htmlEl.getAttribute('type') || '';
                    if (!label && name) {
                        label = `[Поле ввода: ${name}]`;
                    }
                }

                // Handle icon-only buttons (e.g. Lucide SVGs)
                if (!label) {
                    const svg = htmlEl.querySelector('svg');
                    if (svg && typeof svg.className?.baseVal === 'string') {
                        const match = svg.className.baseVal.match(/lucide-([a-z0-9\-]+)/);
                        label = match ? `[Иконка: ${match[1]}]` : '[Иконка]';
                    } else if (htmlEl.tagName.toLowerCase() === 'button') {
                        label = `[Кнопка] class="${(htmlEl.className || '').toString().slice(0, 30)}"`;
                    } else if (htmlEl.parentElement && htmlEl.parentElement.textContent) {
                        // Fallback to parent text if any
                        const parentText = htmlEl.parentElement.textContent.replace(/\s+/g, ' ').trim().slice(0, 40);
                        if (parentText) label = `[Рядом с текстом: ${parentText}]`;
                    }
                }

                const tag = htmlEl.tagName.toLowerCase();
                return { id, label: label.trim(), tag };
            })
            .filter((el) => el.label.length > 0)
            .slice(0, 100);

        // --- COMPRESSION ---
        // Convert to [tag:id:label] string
        const compressedElements = elements
            .map(el => `[${el.tag}:${el.id}:${el.label}]`)
            .join('');

        return { page_text, elements: compressedElements, page_url };
    }

    /**
     * Execute a server-returned action on the DOM.
     * Returns: { result: string, causesNavigation: boolean }
     */
    executeAction(action: ChatAction): { result: string; causesNavigation: boolean } {
        if (action.type === 'click_element' && action.element_id) {
            const el = document.getElementById(action.element_id);
            if (el) {
                if (el.tagName.toLowerCase() === 'a' && (el as HTMLAnchorElement).href) {
                    const href = (el as HTMLAnchorElement).href;
                    // Check if it's a same-origin link (SPA) or external
                    const isSameOrigin = new URL(href, window.location.origin).origin === window.location.origin;
                    if (isSameOrigin) {
                        sessionStorage.setItem('bw-auto-resume', 'true');
                    }
                    // Use click() instead of location.href to let React Router intercept
                    el.click();
                    return { result: `✅ Нажал на "${el.textContent?.trim() || action.element_id}"`, causesNavigation: true };
                } else {
                    el.click();
                    return { result: `✅ Нажал на "${el.textContent?.trim() || action.element_id}"`, causesNavigation: false };
                }
            }
            return { result: `⚠️ Элемент "${action.element_id}" не найден.`, causesNavigation: false };
        }

        if (action.type === 'navigate' && action.url) {
            sessionStorage.setItem('bw-auto-resume', 'true');
            window.location.href = action.url;
            return { result: `🔀 Перехожу на ${action.url}...`, causesNavigation: true };
        }

        if (action.type === 'input_text' && action.element_id && action.value !== undefined) {
            const el = document.getElementById(action.element_id) as HTMLInputElement | HTMLTextAreaElement;
            if (el) {
                // Must simulate React/SPA typing events (value setter + dispatch Event)
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                
                if (el.tagName.toLowerCase() === 'textarea' && nativeTextAreaValueSetter) {
                    nativeTextAreaValueSetter.call(el, action.value);
                } else if (nativeInputValueSetter) {
                    nativeInputValueSetter.call(el, action.value);
                } else {
                    el.value = action.value;
                }
                
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                
                return { result: `⌨️ Ввел текст "${action.value}" в поле.`, causesNavigation: false };
            }
            return { result: `⚠️ Поле ввода "${action.element_id}" не найдено.`, causesNavigation: false };
        }

        if (action.type === 'continue') {
            return { result: '🔄 Анализирую страницу...', causesNavigation: false };
        }

        return { result: '⚠️ Неизвестное действие.', causesNavigation: false };
    }

    /**
     * Call the backend API with the current context.
     */
    private async _callAPI(query: string): Promise<ChatResponse> {
        const { page_text, elements, page_url } = this.gatherContext();
        const fingerprint = getScreenFingerprint();
        
        const hostClientId = (this.host as any).clientId 
            || (window as any).__BARIWEB_CLIENT_ID__ 
            || '';

        // 1. Try to match fingerprint to an admin-trained label
        let screen_label = null;
        try {
            const matchResp = await fetch(`${API_URL}/v1/training/match-screen`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-ID': hostClientId,
                },
                body: JSON.stringify({ fingerprint }),
            });
            if (matchResp.ok) {
                const matchData = await matchResp.json();
                if (matchData.matched) screen_label = matchData.label;
            }
        } catch (e) {
            console.warn('Failed to match screen fingerprint', e);
        }

        // 2. Call the main chat API with the label context
        const resp = await fetch(`${API_URL}/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-ID': hostClientId,
            },
            body: JSON.stringify({ 
                query, 
                history: this._compressedHistory(),
                page_text, 
                elements, 
                page_url,
                screen_label,
                screen_fingerprint: fingerprint
            }),
        });


        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }

        return await resp.json() as ChatResponse;
    }

    /**
     * Returns a compressed history to send to the LLM:
     * - First user message (original intent)
     * - Last 2 assistant+user exchanges (recent context)
     * This prevents token bloat during multi-step agent tasks.
     */
    private _compressedHistory(): Array<{ role: string; text: string }> {
        const all = this.messages.map(m => ({ role: m.role, text: m.text }));
        if (all.length <= 2) return all;

        // Always include first user message (original goal)
        const first = all[0];
        // Get the last 4 messages (2 exchanges) — exclude the very last one since
        // it's the current user message that's already being sent as `query`.
        const recent = all.slice(-4, -1);

        // Deduplicate in case first is already in recent
        const seen = new Set<string>();
        const result: Array<{ role: string; text: string }> = [];
        for (const msg of [first, ...recent]) {
            const key = `${msg.role}|${msg.text.slice(0, 50)}`;
            if (!seen.has(key)) {
                seen.add(key);
                result.push(msg);
            }
        }
        return result;
    }


    /**
     * The main agentic loop. Sends a query, executes actions, and loops
     * if the LLM returns "continue" (up to MAX_AGENT_STEPS).
     */
    private async _agentLoop(initialQuery: string, addUserMessage: boolean): Promise<void> {
        if (this.isLoading) return;
        this.isLoading = true;
        this.error = null;

        if (addUserMessage) {
            this.messages = [...this.messages, { role: 'user', text: initialQuery, timestamp: Date.now() }];
            this._saveMessages();
        }
        this.host.requestUpdate();

        let currentQuery = initialQuery;
        let steps = 0;

        try {
            while (steps < MAX_AGENT_STEPS) {
                steps++;

                const data = await this._callAPI(currentQuery);
                let displayText = data.text;

                if (data.action) {
                    const oldDomText = this.gatherContext().page_text;
                    const { result, causesNavigation } = this.executeAction(data.action);

                    if (data.action.type === 'continue') {
                        // LLM wants to re-read DOM after an in-page state change.
                        // Add a thinking message, wait for DOM to settle, then loop.
                        this.messages = [...this.messages, { role: 'assistant', text: '🔄 Анализирую...', timestamp: Date.now() }];
                        this._saveMessages();
                        this.host.requestUpdate();

                        // Wait for SPA DOM to settle (React re-render)
                        await this._waitForDom(800);
                        currentQuery = "Страница обновилась. Продолжай задачу, прочитай DOM.";
                        continue;
                    }

                    displayText = `${data.text}\n${result}`;

                    if (causesNavigation) {
                        // Full page reload will happen → auto-resume handles continuation
                        this.messages = [...this.messages, { role: 'assistant', text: displayText, timestamp: Date.now() }];
                        this._saveMessages();
                        this.host.requestUpdate();

                        // For SPA (React Router), the page won't fully reload.
                        // Wait a bit and check if URL changed without a reload.
                        await this._waitForDom(1500);
                        
                        // Check if we're still here (SPA navigation, no full reload)
                        const resumeFlag = sessionStorage.getItem('bw-auto-resume');
                        if (resumeFlag === 'true') {
                            // Still on the same page instance — SPA routing happened
                            sessionStorage.removeItem('bw-auto-resume');
                            currentQuery = "Страница загрузилась (SPA навигация). Продолжай задачу, прочитай новый DOM.";
                            continue;
                        }
                        
                        // If we got here, the page is about to fully reload.
                        // auto-resume flag is already set; the new page load handles it.
                        break;
                    }

                    // In-page click that's not a navigation and LLM didn't ask for "continue"
                    // Wait briefly for DOM to update, then loop once more to let LLM see result
                    this.messages = [...this.messages, { role: 'assistant', text: displayText, timestamp: Date.now() }];
                    this._saveMessages();
                    this.host.requestUpdate();

                    // Give more time for input_text (React controlled inputs debounce)
                    const waitMs = data.action.type === 'input_text' ? 1200 : 800;
                    await this._waitForDom(waitMs);
                    const newDomText = this.gatherContext().page_text;
                    
                    if (oldDomText === newDomText && (data.action.type === 'click_element' || data.action.type === 'input_text')) {
                        currentQuery = '⚠️ Действие выполнено, но экран НЕ ИЗМЕНИЛСЯ визуально. Возможно: (1) кнопка не сработала, (2) есть ошибка валидации, (3) ты не на правильной странице. Перечитай DOM, проверь ошибки или переходи на вкладку Карта для подачи жалобы.';
                    } else {
                        currentQuery = 'Действие выполнено, экран ИЗМЕНИЛСЯ. Прочти новый DOM: если видишь успешное подтверждение задачи — сообщи об успехе. Иначе продолжай следующий шаг.';
                    }
                    continue;
                }

                // No action — this is the final answer
                this.messages = [...this.messages, { role: 'assistant', text: displayText, timestamp: Date.now() }];
                this._saveMessages();
                break;
            }
        } catch (e: any) {
            this.error = e.message ?? 'Ошибка соединения';
            this.messages = [
                ...this.messages,
                { role: 'assistant', text: `❌ Ошибка: ${this.error}`, timestamp: Date.now() },
            ];
            this._saveMessages();
        } finally {
            this.isLoading = false;
            this.host.requestUpdate();
        }
    }

    /**
     * Wait for the DOM to settle after a click / SPA navigation.
     */
    private _waitForDom(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Public API: send a user message and start the agentic loop.
     */
    async sendMessage(query: string): Promise<void> {
        if (!query.trim() || this.isLoading) return;
        await this._agentLoop(query, true);
        // Scroll to bottom after the loop ends
        (this.host as any).updateComplete?.then(() => {
            const messagesEl = (this.host as any).renderRoot?.querySelector('.chat-messages');
            if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
        });
    }

    /**
     * Internal: resume agent from a system trigger (e.g. after page load).
     */
    private async _agentStep(sysMsg: string): Promise<void> {
        await this._agentLoop(sysMsg, false);
        (this.host as any).updateComplete?.then(() => {
            const messagesEl = (this.host as any).renderRoot?.querySelector('.chat-messages');
            if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
        });
    }

    clearMessages() {
        this.messages = [];
        this.error = null;
        this._saveMessages();
        this.host.requestUpdate();
    }
}
