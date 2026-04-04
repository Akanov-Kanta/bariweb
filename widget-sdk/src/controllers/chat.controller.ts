import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
    timestamp: number;
}

export interface InteractiveElement {
    id: string;
    label: string;
}

export interface ChatAction {
    type: 'click_element' | 'navigate';
    element_id?: string;
    url?: string;
}

export interface ChatResponse {
    text: string;
    action: ChatAction | null;
}

const API_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:8000';

export class ChatController implements ReactiveController {
    host: ReactiveControllerHost;

    messages: ChatMessage[] = [];
    isLoading = false;
    error: string | null = null;

    constructor(host: ReactiveControllerHost) {
        (this.host = host).addController(this);
    }

    hostConnected() {}
    hostDisconnected() {}

    /**
     * Gather page context: page text + interactive elements with IDs.
     */
    gatherContext(): { page_text: string; elements: InteractiveElement[]; page_url: string } {
        const page_url = window.location.href;

        // Collect page text (trimmed to 1500 chars on backend, but we send more)
        const page_text = document.body?.innerText?.slice(0, 3000) ?? '';

        // Collect interactive elements that have an id attribute
        const interactiveSelectors = 'a[href], button, [role="button"], input[type="submit"], [data-action]';
        const rawElements = Array.from(document.querySelectorAll(interactiveSelectors));

        const elements: InteractiveElement[] = rawElements
            .map((el) => {
                const htmlEl = el as HTMLElement;
                const id =
                    htmlEl.id ||
                    htmlEl.getAttribute('data-id') ||
                    htmlEl.getAttribute('data-testid');
                const label =
                    htmlEl.getAttribute('aria-label') ||
                    htmlEl.textContent?.trim().slice(0, 60) ||
                    htmlEl.getAttribute('title') ||
                    '';
                return id ? { id, label } : null;
            })
            .filter((el): el is InteractiveElement => el !== null && el.label.length > 0)
            .slice(0, 20);

        return { page_text, elements, page_url };
    }

    /**
     * Execute a server-returned action on the DOM.
     */
    executeAction(action: ChatAction): string {
        if (action.type === 'click_element' && action.element_id) {
            const el = document.getElementById(action.element_id);
            if (el) {
                el.click();
                return `✅ Нажал на "${el.textContent?.trim() || action.element_id}"`;
            }
            return `⚠️ Элемент с ID "${action.element_id}" не найден on page.`;
        }

        if (action.type === 'navigate' && action.url) {
            window.location.href = action.url;
            return `🔀 Перехожу на ${action.url}...`;
        }

        return '⚠️ Неизвестное действие.';
    }

    async sendMessage(query: string): Promise<void> {
        if (!query.trim() || this.isLoading) return;

        this.messages = [...this.messages, { role: 'user', text: query, timestamp: Date.now() }];
        this.isLoading = true;
        this.error = null;
        this.host.requestUpdate();

        const { page_text, elements, page_url } = this.gatherContext();

        try {
            // Priority: host property > global window variable
            const hostClientId = (this.host as any).clientId 
                || (window as any).__BARIWEB_CLIENT_ID__ 
                || '';

            const resp = await fetch(`${API_URL}/v1/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-ID': hostClientId,
                },
                body: JSON.stringify({ query, page_text, elements, page_url }),
            });

            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
            }

            const data: ChatResponse = await resp.json();

            let displayText = data.text;

            // Execute the action if present 
            if (data.action) {
                const actionResult = this.executeAction(data.action);
                displayText = `${data.text}\n${actionResult}`;
            }

            this.messages = [
                ...this.messages,
                { role: 'assistant', text: displayText, timestamp: Date.now() },
            ];
        } catch (e: any) {
            this.error = e.message ?? 'Ошибка соединения';
            this.messages = [
                ...this.messages,
                {
                    role: 'assistant',
                    text: `❌ Ошибка: ${this.error}`,
                    timestamp: Date.now(),
                },
            ];
        } finally {
            this.isLoading = false;
            this.host.requestUpdate();
        }
    }

    clearMessages() {
        this.messages = [];
        this.error = null;
        this.host.requestUpdate();
    }
}
