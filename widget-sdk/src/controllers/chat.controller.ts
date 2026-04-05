import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { getScreenFingerprint } from '../lib/Fingerprint.js';
import { TtsController } from './tts.controller.js';


export interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
    timestamp: number;
}

export interface InteractiveElement {
    id: string;
    label: string;
    tag: string;
    type?: string;       // input type (text, email, password, submit, button, etc.)
    placeholder?: string;
    name?: string;
    value?: string;      // current value of input/textarea
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

export type SttLanguageMode = 'kz' | 'ru' | 'en' | 'auto';

export interface SttResponse {
    text: string;
    provider: 'kz' | 'generic';
    detected_language?: string;
}

const API_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:8000';

const MAX_AGENT_STEPS = 5;

// ─── Critical action detection ──────────────────────────────────────────────
// If a button's label or attributes match these patterns, we pause and ask user.

const CRITICAL_PATTERNS = [
    /(submit|отправить|оплатить|сгенерировать|сохранить|перевести|подтвердит|купить|удалить|delete|pay|purchase|buy|send|transfer|confirm|place.?order|checkout|remove|drop|unsubscribe|sign.?out|выйти|уволить)/i,
];

function isCriticalAction(action: ChatAction): boolean {
    if (action.type !== 'click_element' || !action.element_id) return false;
    const el = document.getElementById(action.element_id);
    if (!el) return false;

    // 1. Is it a form submit button? (This catches most 'save' / 'send' actions)
    const isSubmitBtn = el.getAttribute('type') === 'submit' || 
        (el.tagName.toLowerCase() === 'button' && el.closest('form') !== null && el.getAttribute('type') !== 'button');
    if (isSubmitBtn) return true;

    // 2. Does it use critical wording?
    const checkStr = [
        el.textContent?.trim() || '',
        el.getAttribute('aria-label') || '',
        el.getAttribute('title') || '',
        el.getAttribute('name') || '',
        el.getAttribute('value') || '',
    ].join(' ');

    return CRITICAL_PATTERNS.some(p => p.test(checkStr));
}


export class ChatController implements ReactiveController {
    host: ReactiveControllerHost;

    messages: ChatMessage[] = [];
    isLoading = false;
    error: string | null = null;
    private _tts = new TtsController();
    private _voiceMode = false; // Whether the current interaction started via voice

    // ─── Confirmation flow ──────────────────────────────────────────
    /** When non-null, the agent is paused waiting for user confirmation */
    pendingConfirmation: {
        text: string;               // What the AI wants to do
        action: ChatAction;         // The action to execute
        currentQuery: string;       // Loop context
        step: number;               // Current step
    } | null = null;

    constructor(host: ReactiveControllerHost) {
        (this.host = host).addController(this);
        this._loadMessages();
    }

    hostConnected() {}
    hostDisconnected() {
        this._tts.stop();
    }

    private _shouldSpeak(): boolean {
        return this._voiceMode || this._tts.isEnabled();
    }

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
            if (autoResume === 'true' || autoResume === 'verify-only') {
                sessionStorage.removeItem('bw-auto-resume');
                const resumeMsg = autoResume === 'verify-only'
                    ? 'Страница загрузилась после отправки формы. Проверь новый DOM: если авторизация прошла успешно (нет формы входа, есть контент приложения) — сообщи об успехе. НЕ нажимай ничего снова.'
                    : 'Страница загрузилась. Продолжай выполнение задачи с учетом нового контекста и DOM.';
                setTimeout(() => {
                    this._agentStep(resumeMsg);
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
     * Gather page context for the AI agent.
     * Format: [tag|type|id|name|placeholder|value|label]
     */
    gatherContext(): { page_text: string; elements: string; page_url: string } {
        const page_url = window.location.href;
        const page_text = document.body?.innerText?.slice(0, 3000) ?? '';

        const interactiveSelectors = 'a[href], button, [role="button"], input:not([type="hidden"]), textarea, select';
        const rawElements = Array.from(document.querySelectorAll(interactiveSelectors))
            .filter(el => !el.hasAttribute('bw-private'));

        const elements: InteractiveElement[] = rawElements
            .map((el) => {
                const htmlEl = el as HTMLElement;
                const tagName = htmlEl.tagName.toLowerCase();
                const isFormField = tagName === 'input' || tagName === 'textarea' || tagName === 'select';

                const inputType = htmlEl.getAttribute('type')
                    || (tagName === 'input' ? 'text' : (tagName === 'button' ? 'button' : tagName));
                const name = htmlEl.getAttribute('name') || '';
                const placeholder = htmlEl.getAttribute('placeholder') || '';
                let currentValue = isFormField
                    ? ((htmlEl as HTMLInputElement).value || '').slice(0, 80)
                    : '';

                // Local masking for sensitive data
                if (currentValue) {
                    // Mask 16-digit card numbers
                    currentValue = currentValue.replace(/\b\d{13,19}\b/g, (match) => 
                        match.slice(0, 4) + ' **** **** ' + match.slice(-4)
                    );
                    // Mask 12-digit IIN
                    currentValue = currentValue.replace(/\b\d{12}\b/g, '**** **** ****');
                }

                let id = htmlEl.id && !htmlEl.getAttribute('data-bw-auto')
                    ? htmlEl.id
                    : htmlEl.getAttribute('data-id') || htmlEl.getAttribute('data-testid') || '';

                if (!id) {
                    const cls = (htmlEl.className || '').toString().replace(/\s+/g, '-').slice(0, 40);
                    const href = (htmlEl as HTMLAnchorElement).href || '';
                    const textSnip = (htmlEl.textContent || '').trim().slice(0, 30);
                    const parentTag = htmlEl.parentElement?.tagName?.toLowerCase() || 'root';
                    const raw = `${tagName}|${inputType}|${name}|${placeholder}|${cls}|${href}|${textSnip}|${parentTag}`;

                    let h = 5381;
                    for (let i = 0; i < raw.length; i++) {
                        h = ((h << 5) + h) ^ raw.charCodeAt(i);
                    }
                    id = `bw-${(h >>> 0).toString(16)}`;
                    htmlEl.id = id;
                    htmlEl.setAttribute('data-bw-auto', 'true');
                }

                let label = htmlEl.getAttribute('aria-label') || '';
                if (!label && id) {
                    const associated = document.querySelector(`label[for="${id}"]`);
                    if (associated) label = associated.textContent?.trim() || '';
                }
                if (!label) {
                    let p = htmlEl.parentElement;
                    while (p && p.tagName.toLowerCase() !== 'form' && p.tagName.toLowerCase() !== 'body') {
                        if (p.tagName.toLowerCase() === 'label') {
                            label = (p.textContent || '').replace(htmlEl.textContent || '', '').trim();
                            break;
                        }
                        p = p.parentElement;
                    }
                }
                if (!label) label = (htmlEl.textContent || '').trim().slice(0, 80);
                if (!label) label = htmlEl.getAttribute('title') || '';
                if (!label && placeholder) label = placeholder;
                if (!label && tagName === 'button') {
                    const svg = htmlEl.querySelector('svg');
                    if (svg && typeof svg.className?.baseVal === 'string') {
                        const match = svg.className.baseVal.match(/lucide-([a-z0-9\-]+)/);
                        label = match ? `[icon:${match[1]}]` : '[icon]';
                    } else {
                        label = `[btn:${(htmlEl.className || '').toString().slice(0, 30)}]`;
                    }
                }

                return {
                    id,
                    label: label.trim(),
                    tag: tagName,
                    type: inputType,
                    name,
                    placeholder,
                    value: currentValue,
                } as InteractiveElement;
            })
            .filter((el) => el.label.length > 0 || (el.placeholder ?? '').length > 0 || (el.name ?? '').length > 0)
            .slice(0, 100);

        const compressedElements = elements
            .map(el => {
                const parts = [
                    el.tag, el.type || '', el.id, el.name || '',
                    el.placeholder || '', el.value || '', el.label,
                ];
                return '[' + parts.join('|') + ']';
            })
            .join('');

        // Mask sensitive data in page text as well
        let maskedPageText = page_text;
        maskedPageText = maskedPageText.replace(/\b\d{13,19}\b/g, '**** **** **** ****');
        maskedPageText = maskedPageText.replace(/\b\d{12}\b/g, '**** **** ****');

        return { page_text: maskedPageText, elements: compressedElements, page_url };
    }

    /**
     * Execute a server-returned action on the DOM.
     */
    executeAction(action: ChatAction): { result: string; causesNavigation: boolean } {
        if (action.type === 'click_element' && action.element_id) {
            const el = document.getElementById(action.element_id);
            if (el) {
                if (el.tagName.toLowerCase() === 'a' && (el as HTMLAnchorElement).href) {
                    const href = (el as HTMLAnchorElement).href;
                    const isSameOrigin = new URL(href, window.location.origin).origin === window.location.origin;
                    if (isSameOrigin) {
                        sessionStorage.setItem('bw-auto-resume', 'true');
                    }
                    el.click();
                    return { result: `✅ Нажал на "${el.textContent?.trim() || action.element_id}"`, causesNavigation: true };
                }

                const isSubmit = el.getAttribute('type') === 'submit'
                    || (el.tagName.toLowerCase() === 'button' && el.closest('form') !== null && el.getAttribute('type') !== 'button');

                if (isSubmit) {
                    sessionStorage.setItem('bw-auto-resume', 'verify-only');
                    el.click();
                    return { result: `✅ Нажал на "${el.textContent?.trim() || action.element_id}"`, causesNavigation: true };
                }

                el.click();
                return { result: `✅ Нажал на "${el.textContent?.trim() || action.element_id}"`, causesNavigation: false };
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

        const data = await resp.json() as ChatResponse;

        // Safety net: if backend somehow returned raw JSON in the text field, extract it
        if (data.text && data.text.trimStart().startsWith('{')) {
            try {
                const inner = JSON.parse(data.text);
                if (inner.text) {
                    data.text = inner.text;
                    if (inner.action && !data.action) data.action = inner.action;
                }
            } catch {
                // Not valid JSON — show as-is (partial text is acceptable)
                data.text = data.text.replace(/^\{"text"\s*:\s*"/, '').replace(/",?\s*"action".*$/, '');
            }
        }

        return data;
    }

    /**
     * MINIMAL history sent to LLM:
     *  - The LAST user message (original task intent)
     *  - Last 2 assistant messages (action results only)
     *
     * We deliberately DROP early context. The LLM already gets the
     * current DOM, elements, and page_url as context — that's the
     * ground truth. Old history just confuses it.
     */
    private _compressedHistory(): Array<{ role: string; text: string }> {
        const all = this.messages.map(m => ({ role: m.role, text: m.text }));
        if (all.length <= 3) return all;

        // Find the last user message (that's the current task)
        let lastUserIdx = -1;
        for (let i = all.length - 1; i >= 0; i--) {
            if (all[i].role === 'user') { lastUserIdx = i; break; }
        }
        if (lastUserIdx === -1) return all.slice(-3);

        const lastUser = all[lastUserIdx];
        // Get last 2 assistant messages AFTER the last user message
        const afterUser = all.slice(lastUserIdx + 1).filter(m => m.role === 'assistant');
        const recentAssistant = afterUser.slice(-2);

        return [lastUser, ...recentAssistant];
    }


    /**
     * Main agentic loop with CONFIRMATION for critical actions.
     */
    private async _agentLoop(initialQuery: string, addUserMessage: boolean, isVoice = false): Promise<void> {
        if (this.isLoading) return;
        this.isLoading = true;
        this.error = null;
        this._voiceMode = isVoice;

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
                    // ─── CRITICAL ACTION GATE ─────────────────────────────
                    // Before submit/pay/delete: STOP and ask user for confirmation.
                    if (isCriticalAction(data.action)) {
                        const el = document.getElementById(data.action.element_id || '');
                        const btnLabel = el?.textContent?.trim() || data.action.element_id || 'кнопку';

                        this.pendingConfirmation = {
                            text: `${data.text}\n\n⚠️ Нажать «${btnLabel}»?`,
                            action: data.action,
                            currentQuery,
                            step: steps,
                        };
                        this.messages = [
                            ...this.messages,
                            { role: 'assistant', text: `${data.text}\n\n🛑 **Подтвердите действие:** нажать «${btnLabel}»?`, timestamp: Date.now() },
                        ];
                        this._saveMessages();
                        if (this._shouldSpeak()) this._tts.speak(data.text);
                        this.isLoading = false;
                        this.host.requestUpdate();
                        return; // Pause loop — user must call confirmAction() or cancelAction()
                    }

                    const oldDomText = this.gatherContext().page_text;
                    const { result, causesNavigation } = this.executeAction(data.action);

                    if (data.action.type === 'continue') {
                        this.messages = [...this.messages, { role: 'assistant', text: '🔄 Анализирую...', timestamp: Date.now() }];
                        this._saveMessages();
                        if (this._shouldSpeak()) this._tts.speak('Анализирую...');
                        this.host.requestUpdate();
                        await this._waitForDom(800);
                        currentQuery = "Страница обновилась. Продолжай задачу, прочитай DOM.";
                        continue;
                    }

                    displayText = `${data.text}\n${result}`;

                    if (causesNavigation) {
                        this.messages = [...this.messages, { role: 'assistant', text: displayText, timestamp: Date.now() }];
                        this._saveMessages();
                        if (this._shouldSpeak()) this._tts.speak(displayText);
                        this.host.requestUpdate();
                        await this._waitForDom(1500);
                        
                        const resumeFlag = sessionStorage.getItem('bw-auto-resume');
                        if (resumeFlag === 'true' || resumeFlag === 'verify-only') {
                            sessionStorage.removeItem('bw-auto-resume');
                            currentQuery = resumeFlag === 'verify-only'
                                ? 'Страница загрузилась после отправки формы (SPA навигация). Проверь новый DOM: если задача выполнена — сообщи об успехе. НЕ нажимай ничего снова.'
                                : 'Страница загрузилась (SPA навигация). Продолжай задачу, прочитай новый DOM.';
                            continue;
                        }
                        break;
                    }

                    this.messages = [...this.messages, { role: 'assistant', text: displayText, timestamp: Date.now() }];
                    this._saveMessages();
                    if (this._shouldSpeak()) this._tts.speak(displayText);
                    this.host.requestUpdate();

                    if (data.action.type === 'input_text' && data.action.element_id) {
                        await this._waitForDom(800);
                        const filledEl = document.getElementById(data.action.element_id) as HTMLInputElement | null;
                        const actualValue = filledEl?.value ?? '';

                        if (actualValue.length > 0) {
                            currentQuery = `✅ Поле заполнено. Переходи к СЛЕДУЮЩЕМУ незаполненному полю или нажми кнопку отправки. НЕ повторяй ввод.`;
                        } else {
                            currentQuery = `⚠️ Поле не получило значение. Попробуй ввести снова в id="${data.action.element_id}".`;
                        }
                    } else {
                        await this._waitForDom(800);
                        const newDomText = this.gatherContext().page_text;
                        if (oldDomText === newDomText) {
                            currentQuery = '⚠️ Страница не изменилась. Возможно кнопка не сработала. Проверь DOM.';
                        } else {
                            currentQuery = 'Действие выполнено. Если задача готова — сообщи. Иначе продолжай.';
                        }
                    }
                    continue;
                }

                // No action — final answer
                this.messages = [...this.messages, { role: 'assistant', text: displayText, timestamp: Date.now() }];
                this._saveMessages();
                if (this._shouldSpeak()) this._tts.speak(displayText);
                break;
            }
        } catch (e: any) {
            this.error = e.message ?? 'Ошибка соединения';
            this.messages = [
                ...this.messages,
                { role: 'assistant', text: `❌ Ошибка: ${this.error}`, timestamp: Date.now() },
            ];
            this._saveMessages();
            if (this._shouldSpeak()) this._tts.speak(`Ошибка: ${this.error}`);
        } finally {
            this.isLoading = false;
            this.host.requestUpdate();
        }
    }

    // ─── Confirmation public API ──────────────────────────────────────

    /** User confirmed the critical action → execute it and resume the loop */
    async confirmAction(): Promise<void> {
        if (!this.pendingConfirmation) return;
        const { action } = this.pendingConfirmation;
        this.pendingConfirmation = null;

        this.messages = [...this.messages, { role: 'user', text: '✅ Подтверждаю', timestamp: Date.now() }];
        this._saveMessages();
        this.host.requestUpdate();

        // Execute the action
        const { result, causesNavigation } = this.executeAction(action);
        this.messages = [...this.messages, { role: 'assistant', text: result, timestamp: Date.now() }];
        this._saveMessages();
        if (this._shouldSpeak()) this._tts.speak(result);
        this.host.requestUpdate();

        if (causesNavigation) {
            // Navigation will happen, auto-resume will handle continuation
            return;
        }

        // If it didn't cause navigation, let the agent check the result
        await this._waitForDom(1200);
        await this._agentStep('Действие подтверждено и выполнено. Проверь результат в DOM.');
    }

    /** User cancelled the critical action → inform the agent */
    cancelAction(): void {
        if (!this.pendingConfirmation) return;
        this.pendingConfirmation = null;

        this.messages = [
            ...this.messages,
            { role: 'user', text: '❌ Отмена', timestamp: Date.now() },
            { role: 'assistant', text: '🚫 Действие отменено. Чем ещё могу помочь?', timestamp: Date.now() },
        ];
        this._saveMessages();
        if (this._shouldSpeak()) this._tts.speak('Действие отменено. Чем ещё могу помочь?');
        this.host.requestUpdate();
    }


    private _waitForDom(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Public API: send a user message and start the agentic loop.
     */
    async sendMessage(query: string, isVoice = false): Promise<void> {
        if (!query.trim() || this.isLoading) return;
        await this._agentLoop(query, true, isVoice);
        (this.host as any).updateComplete?.then(() => {
            const messagesEl = (this.host as any).renderRoot?.querySelector('.chat-messages');
            if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
        });
    }

    private async _agentStep(sysMsg: string): Promise<void> {
        await this._agentLoop(sysMsg, false, this._voiceMode);
        (this.host as any).updateComplete?.then(() => {
            const messagesEl = (this.host as any).renderRoot?.querySelector('.chat-messages');
            if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
        });
    }

    clearMessages() {
        this.messages = [];
        this.error = null;
        this.pendingConfirmation = null;
        this._saveMessages();
        this.host.requestUpdate();
    }

    isTtsEnabled(): boolean {
        return this._tts.isEnabled();
    }

    setTtsEnabled(value: boolean): void {
        this._tts.setEnabled(value);
        this.host.requestUpdate();
    }

    async transcribeAudio(audioBlob: Blob, languageMode: SttLanguageMode): Promise<SttResponse> {
        const hostClientId = (this.host as any).clientId
            || (window as any).__BARIWEB_CLIENT_ID__
            || '';

        const formData = new FormData();
        formData.append('language_mode', languageMode);
        formData.append('audio', audioBlob, 'speech.wav');

        const resp = await fetch(`${API_URL}/v1/stt/transcribe`, {
            method: 'POST',
            headers: {
                'X-Client-ID': hostClientId,
            },
            body: formData,
        });

        if (!resp.ok) {
            let detail = `HTTP ${resp.status}`;
            try {
                const err = await resp.json();
                detail = err?.detail || detail;
            } catch {
                // keep fallback detail
            }
            throw new Error(detail);
        }

        return await resp.json() as SttResponse;
    }
}
