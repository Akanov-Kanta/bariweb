/**
 * Fingerprint.ts — Screen Fingerprinting for SPA State Identification
 *
 * Generates a stable semantic hash of the current screen's interactive elements.
 * Improved to ignore content tags and focus on structural elements.
 */

const NOISE_WORDS = new Set([
    'ok', 'ок', 'okay', 'close', 'закрыть', 'cancel', 'отмена',
    'yes', 'da', 'no', 'нет', 'да', 'submit', 'отправить',
    'back', 'назад', 'next', 'далее', 'more', 'ещё', 'ещe',
    'menu', 'меню', '...', '•', '·',
]);

/**
 * Extracts a clean label from an element (text, aria-label, etc).
 */
function getElementLabel(el: Element): string {
    const text = (
        el.getAttribute('aria-label') ||
        (el as HTMLElement).innerText ||
        el.getAttribute('title') ||
        el.getAttribute('placeholder') ||
        ''
    ).trim().toLowerCase().slice(0, 40);
    // Ignore pure numbers or very long text
    if (/^\d+$/.test(text) || text.length > 30) return '';
    return text;
}

/**
 * Filter out elements inside pure content areas like articles or long paragraphs.
 */
function isStructuralElement(el: Element): boolean {
    const contentContainers = ['article', 'section', 'p'];
    let parent = el.parentElement;
    while (parent) {
        if (contentContainers.includes(parent.tagName.toLowerCase())) {
            // If it's a small element inside a button inside a section, it's fine.
            // But if it's just raw text in a section, we skip.
            if (parent.tagName.toLowerCase() === 'p') return false;
            if (parent.querySelectorAll('p').length > 5) return false; // Likely a long article
        }
        parent = parent.parentElement;
    }
    return true;
}

/**
 * Simple djb2-style hash for a string.
 */
function djb2Hash(str: string): string {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h) ^ str.charCodeAt(i);
    }
    return (h >>> 0).toString(16);
}

/**
 * Generates a semantic fingerprint based on top unique interactive elements.
 */
export function getScreenFingerprint(): string {
    const tokens = getFingerprintTokens();
    const tokenStr = tokens.join('|');
    return `bw-screen-${djb2Hash(tokenStr)}`;
}

/**
 * Returns a human-readable summary of the fingerprint for debugging.
 */
export function getFingerprintTokens(): string[] {
    const interactiveEls = Array.from(
        document.querySelectorAll('button, [role="button"], nav a, [role="tab"], .bw-btn')
    );

    return interactiveEls
        .filter(el => isStructuralElement(el))
        .map(getElementLabel)
        .filter(label => label.length > 1 && !NOISE_WORDS.has(label))
        .reduce((acc: string[], label) => {
            if (!acc.includes(label)) acc.push(label);
            return acc;
        }, [])
        .sort()
        .slice(0, 10);
}
