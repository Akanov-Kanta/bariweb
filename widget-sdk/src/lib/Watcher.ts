/**
 * Watcher.ts — MutationObserver-based SPA State Watcher
 *
 * Screen change detection strategy (stable):
 *  1. URL change → ALWAYS a new screen (most reliable)
 *  2. Token similarity < 0.55 → structural screen change
 *     (higher threshold = fewer false positives from tooltips/loaders)
 *
 * Passive Discovery: when admin is logged in, every real screen change
 * is auto-reported to the backend. No manual save required.
 */

import { getScreenFingerprint, getFingerprintTokens, normalizeUrl } from './Fingerprint.js';

export interface LiveSnapshot {
    url: string;
    headings: string[];
    fingerprint: string;
    elements: Array<{ id: string; text: string }>;
}

export interface DiscoveryResult {
    status: 'existing' | 'created';
    is_trained: boolean;
    label: string | null;
    description: string | null;
}

type StateChangeCallback = (snapshot: LiveSnapshot) => void;
type DiscoveryCallback = (result: DiscoveryResult) => void;

/**
 * Jaccard similarity between two token sets.
 */
function similarity(a: Set<string>, b: Set<string>): number {
    const intersection = new Set([...a].filter(x => b.has(x)));
    const union = new Set([...a, ...b]);
    return union.size === 0 ? 1 : intersection.size / union.size;
}

export class BariwebWatcher {
    private _observer: MutationObserver | null = null;
    private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private _lastTokens: Set<string> = new Set();
    private _lastUrl: string = '';
    private _callbacks: StateChangeCallback[] = [];
    private _discoveryCallbacks: DiscoveryCallback[] = [];
    private readonly _debounceMs: number;
    private _isDiscovering = false;

    /** Enable passive discovery (set to true on admin login) */
    public isAutoDiscoveryEnabled = false;

    constructor(debounceMs = 1500) {
        this._debounceMs = debounceMs;
    }

    start(): void {
        if (this._observer) return;

        this._lastTokens = new Set(getFingerprintTokens());
        this._lastUrl = normalizeUrl(window.location.href);

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

    onStateChange(cb: StateChangeCallback): void { this._callbacks.push(cb); }
    onDiscovery(cb: DiscoveryCallback): void { this._discoveryCallbacks.push(cb); }

    get isDiscovering(): boolean { return this._isDiscovering; }

    getLiveSnapshot(): LiveSnapshot {
        const headings = Array.from(document.querySelectorAll('h1, h2'))
            .map(el => (el as HTMLElement).innerText?.trim())
            .filter(Boolean)
            .slice(0, 3);

        const els = Array.from(document.querySelectorAll('button, a[href], [role="button"]'))
            .map(el => {
                const htmlEl = el as HTMLElement;
                const text = (
                    htmlEl.getAttribute('aria-label') ||
                    htmlEl.innerText || ''
                ).trim().slice(0, 60);
                return { id: htmlEl.id || '', text };
            })
            .filter(e => e.text.length > 0)
            .slice(0, 30);

        return {
            url: window.location.href,
            headings,
            fingerprint: getScreenFingerprint(),
            elements: els,
        };
    }

    private async _onMutation(): Promise<void> {
        // Wait for the page to be fully interactive before fingerprinting
        if (document.readyState !== 'complete') return;

        const currentUrl = normalizeUrl(window.location.href);
        const currentTokens = new Set(getFingerprintTokens());

        // Skip if we got almost no tokens — page probably still loading
        if (currentTokens.size < 2) return;

        const newFingerprint = getScreenFingerprint();

        // Primary: URL route change = definitely new screen template
        const urlChanged = currentUrl !== this._lastUrl;

        // Secondary: structural content changed significantly
        const sim = similarity(this._lastTokens, currentTokens);
        const structureChanged = sim < 0.55;

        if (urlChanged || structureChanged) {
            const reason = urlChanged ? `URL: ${this._lastUrl} → ${currentUrl}` : `Sim: ${sim.toFixed(2)}`;
            console.log(`[Watcher] Screen change (${reason})`);

            this._lastUrl = currentUrl;
            this._lastTokens = currentTokens;

            const snapshot = this.getLiveSnapshot();

            if (this.isAutoDiscoveryEnabled) {
                // Non-blocking — don't await
                this._discover(newFingerprint, [...currentTokens]).catch(() => {});
            }

            this._callbacks.forEach(cb => cb(snapshot));
        }
        // else: ignore — minor DOM noise (tooltip, badge, animation)
    }

    /**
     * POST to /v1/training/discover — passive, no user interaction needed.
     * Backend creates a draft if new, returns existing data if seen before.
     */
    private async _discover(fingerprint: string, tokens: string[]): Promise<void> {
        const token = localStorage.getItem('bw_admin_token');
        if (!token) return;

        this._isDiscovering = true;

        try {
            const resp = await fetch('http://localhost:8000/v1/training/discover', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fingerprint,
                    tokens,
                    page_url: window.location.href,
                }),
            });

            if (resp.ok) {
                const result: DiscoveryResult = await resp.json();
                console.log(`[Discovery] ${result.status} — ${result.label}`);
                this._discoveryCallbacks.forEach(cb => cb(result));
            } else if (resp.status === 401) {
                console.warn('[Discovery] Token expired — disabling auto-discovery');
                localStorage.removeItem('bw_admin_token');
                this.isAutoDiscoveryEnabled = false;
            } else {
                console.warn(`[Discovery] Server error ${resp.status}`);
            }
        } catch (e) {
            console.warn('[Discovery] Network error', e);
        } finally {
            this._isDiscovering = false;
        }
    }

    /** Immediately discover the current screen (called on admin login) */
    public async forceDiscovery(): Promise<void> {
        const tokens = [...new Set(getFingerprintTokens())];
        const fingerprint = getScreenFingerprint();
        await this._discover(fingerprint, tokens);
    }
}

export const bariwebWatcher = new BariwebWatcher(1500);
