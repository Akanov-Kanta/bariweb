/**
 * Watcher.ts — MutationObserver-based SPA State Watcher
 */

import { getScreenFingerprint, getFingerprintTokens } from './Fingerprint.js';

export interface LiveSnapshot {
    url: string;
    headings: string[];
    fingerprint: string;
    elements: Array<{ id: string; text: string }>;
}

type StateChangeCallback = (snapshot: LiveSnapshot) => void;

/**
 * Scrub technical/PII data before sending to backend.
 * Replaces emails and sequences of 4+ digits with [REDACTED].
 */
export function scrubContext(text: string): string {
    if (!text) return '';
    // Mask emails
    let scrubbed = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL-REDACTED]');
    // Mask long numbers (credit cards, phones, IDs) - any sequence of 5+ digits
    scrubbed = scrubbed.replace(/\d{5,}/g, '[NUM-REDACTED]');
    return scrubbed;
}

/**
 * Calculates Jaccard Similarity between two sets of tokens.
 * Used to avoid duplicate indexing of content-heavy pages.
 */
function calculateSimilarity(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
}

export class BariwebWatcher {
    private _observer: MutationObserver | null = null;
    private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private _lastFingerprint: string = '';
    private _lastTokens: Set<string> = new Set();
    private _callbacks: StateChangeCallback[] = [];
    private readonly _debounceMs: number;

    public isAutoDiscoveryEnabled = false;

    constructor(debounceMs = 400) {
        this._debounceMs = debounceMs;
    }

    start(): void {
        if (this._observer) return;

        const initialTokens = getFingerprintTokens();
        this._lastTokens = new Set(initialTokens);
        this._lastFingerprint = getScreenFingerprint();

        this._observer = new MutationObserver(() => {
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => this._onMutation(), this._debounceMs);
        });

        this._observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false,
        });
    }

    stop(): void {
        this._observer?.disconnect();
        this._observer = null;
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
    }

    onStateChange(cb: StateChangeCallback): void {
        this._callbacks.push(cb);
    }

    getLiveSnapshot(): LiveSnapshot {
        const url = scrubContext(window.location.href);

        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
            .map(el => scrubContext((el as HTMLElement).innerText.trim()))
            .filter(Boolean)
            .slice(0, 5);

        const els = Array.from(
            document.querySelectorAll('button, a[href], [role="button"]')
        )
            .map(el => {
                const htmlEl = el as HTMLElement;
                const text = scrubContext(
                    htmlEl.getAttribute('aria-label') ||
                    htmlEl.innerText ||
                    htmlEl.getAttribute('title') ||
                    ''
                ).trim().slice(0, 60);
                const id = htmlEl.id || htmlEl.getAttribute('data-testid') || '';
                return { id, text };
            })
            .filter(e => e.text.length > 0)
            .slice(0, 30);

        return {
            url,
            headings,
            fingerprint: getScreenFingerprint(),
            elements: els,
        };
    }

    private async _onMutation(): Promise<void> {
        const currentTokens = getFingerprintTokens();
        const currentSet = new Set(currentTokens);
        const newFingerprint = getScreenFingerprint();
        
        // Smart Similarity Filter: only trigger if similarity < 90%
        const similarity = calculateSimilarity(this._lastTokens, currentSet);
        
        if (similarity < 0.9) {
            console.log(`Watcher: Screen structural shift from ${this._lastFingerprint} to ${newFingerprint} (Sim: ${similarity.toFixed(2)})`);
            this._lastTokens = currentSet;
            this._lastFingerprint = newFingerprint;
            
            const snapshot = this.getLiveSnapshot();
            
            // Auto-Discovery: Save draft to backend if enabled
            if (this.isAutoDiscoveryEnabled) {
                this._autoSave(newFingerprint, currentTokens);
            }

            this._callbacks.forEach(cb => cb(snapshot));
        }
    }

    private async _autoSave(fingerprint: string, tokens: string[]): Promise<void> {
        const token = localStorage.getItem('bw_admin_token');
        if (!token) return;

        try {
            await fetch('http://localhost:8000/v1/training/auto-save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fingerprint,
                    tokens,
                    page_url: window.location.href
                })
            });
        } catch (e) {
            console.warn('Auto-discovery save failed', e);
        }
    }
}

export const bariwebWatcher = new BariwebWatcher(400);
