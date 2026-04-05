/**
 * Fingerprint.ts — Stable Screen Fingerprinting
 *
 * Core insight: fingerprint = SCREEN TEMPLATE, not data instance.
 *
 * /users/123          → /users/:id       } same screen
 * /users/456          → /users/:id       }
 * /products/red-shoes → /products/:slug  } same screen
 * /orders/uuid-here   → /orders/:id      }
 *
 * Strategy (in priority order):
 *  1. Normalized URL route (replaces IDs/UUIDs/slugs with :param)
 *  2. H1 text (page identity, first 30 chars)
 *  3. Form field names/placeholders (structural — stable across instances)
 *  4. Nav link texts (global nav is constant)
 *  5. Primary action button texts (max 4, inside main content)
 *
 * Excluded to avoid noise:
 *  - Transient UI: tooltips, popovers, dropdowns, dialogs
 *  - Pure numbers, prices, dates
 *  - Buttons inside transient containers
 */

// ─── URL Normalization ────────────────────────────────────────────────────────

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const NUMERIC_ID_RE = /\/\d{1,20}(?=\/|$)/g;
// Slugs: kebab-case with digits at the end, e.g. "red-shoes-123", "abc-product-2"
const SLUG_WITH_DIGIT_RE = /\/[a-z0-9]+(?:-[a-z0-9]+)*-\d+(?=\/|$)/g;
// Pure hex hashes (short tokens like commit shas, order IDs)
const HEX_SEGMENT_RE = /\/[0-9a-f]{8,}(?=\/|$)/gi;
// Query params that contain IDs (keep key, remove value)
const DYNAMIC_QUERY_PARAMS = new Set([
    'id', 'userId', 'user_id', 'orderId', 'order_id', 'itemId', 'item_id',
    'productId', 'product_id', 'token', 'key', 'ref', 'code', 'session',
]);

/**
 * Converts a specific URL into a route template.
 *
 * Examples:
 *   /dashboard/settings          → /dashboard/settings   (unchanged)
 *   /users/123/profile           → /users/:id/profile
 *   /orders/abc-123/details      → /orders/:id/details
 *   /blog/my-post-title-456      → /blog/:slug
 *   /products/550e8400-e29b-...  → /products/:id
 *   /api/v2/items?id=99&page=1   → /api/v2/items?:id&page=1
 */
export function normalizeUrl(url: string): string {
    try {
        const parsed = new URL(url);
        let path = parsed.pathname;

        // Order matters: UUIDs first (most specific), then slugs, then pure numbers
        path = path.replace(UUID_RE, ':id');
        path = path.replace(NUMERIC_ID_RE, '/:id');
        path = path.replace(SLUG_WITH_DIGIT_RE, '/:slug');
        path = path.replace(HEX_SEGMENT_RE, '/:id');

        // Normalize query params (keep structural params like ?tab=, strip ID values)
        const newParams = new URLSearchParams();
        parsed.searchParams.forEach((value, key) => {
            if (DYNAMIC_QUERY_PARAMS.has(key)) {
                newParams.set(`:${key}`, '');  // Keep the key, mark as dynamic
            } else if (value.length < 30 && !/^\d+$/.test(value)) {
                newParams.set(key, value);    // Keep non-ID, non-numeric params (like ?tab=settings)
            }
        });
        const queryStr = newParams.toString();

        return path.replace(/\/$/, '') + (queryStr ? `?${queryStr}` : '');
    } catch {
        // Fallback: just strip obvious IDs from the raw string
        return url
            .replace(UUID_RE, ':id')
            .replace(/\/\d{1,20}(?=\/|$)/g, '/:id')
            .split('?')[0];
    }
}

// ─── Noise filters ────────────────────────────────────────────────────────────

const NOISE_WORDS = new Set([
    'ok', 'ок', 'okay', 'close', 'закрыть', 'cancel', 'отмена',
    'yes', 'da', 'no', 'нет', 'да', 'submit', 'отправить',
    'back', 'назад', 'next', 'далее', 'more', 'ещё', 'еще',
    'menu', 'меню', '...', '•', '·', 'loading', 'загрузка',
    'open', 'открыть', 'expand', 'collapse', 'toggle', 'sort',
]);

function isInsideTransient(el: Element): boolean {
    const TRANSIENT_ROLES = ['dialog', 'tooltip', 'menu', 'listbox', 'alertdialog'];
    let node: Element | null = el;
    while (node && node !== document.body) {
        const role = node.getAttribute('role') || '';
        if (TRANSIENT_ROLES.includes(role)) return true;
        if (node.hasAttribute('data-radix-popper-content-wrapper')) return true;
        if (node.hasAttribute('data-floating-ui-portal')) return true;
        const cls = typeof node.className === 'string' ? node.className : '';
        if (/popover|tooltip|dropdown-menu|floating|overlay/i.test(cls)) return true;
        node = node.parentElement;
    }
    return false;
}

/**
 * Returns true if the element lives inside a repeating data list:
 * article list, product grid, table rows, feed items, card grids, etc.
 *
 * Heuristic: if the element's closest ancestor is a <li>, <article>,
 * <tr>, or a container whose direct children share the same tag, it's
 * probably inside repeating content and should NOT affect the fingerprint.
 */
function isInsideRepeatingList(el: Element): boolean {
    // Fast check: is it inside a <li>, <article>, or <tr>?
    const CONTENT_ITEM_TAGS = ['li', 'article', 'tr', 'dd'];
    let node: Element | null = el.parentElement;
    let depth = 0;
    while (node && node !== document.body && depth < 8) {
        const tag = node.tagName.toLowerCase();
        if (CONTENT_ITEM_TAGS.includes(tag)) return true;

        // Check for class-based card/item containers
        const cls = typeof node.className === 'string' ? node.className : '';
        if (/\b(card|item|tile|post|entry|product|row-item|list-item|feed-item|cell)\b/i.test(cls)) {
            // Confirm it's actually repeating: check sibling count
            const siblings = node.parentElement?.children;
            if (siblings && siblings.length > 2) return true;
        }

        // Check for [role="listitem"] or [role="row"]
        const role = node.getAttribute('role') || '';
        if (role === 'listitem' || role === 'row' || role === 'gridcell') return true;

        node = node.parentElement;
        depth++;
    }
    return false;
}

function cleanLabel(el: Element): string {
    const htmlEl = el as HTMLElement;
    const raw = (
        htmlEl.getAttribute('aria-label') ||
        htmlEl.getAttribute('title') ||
        htmlEl.innerText ||
        htmlEl.getAttribute('placeholder') ||
        ''
    ).trim().toLowerCase();

    if (!raw || raw.length < 2 || raw.length > 40) return '';
    if (/^[\d\s₸$€%.,\-+:()]+$/.test(raw)) return '';   // pure numbers/prices
    if (/^\d{1,2}[./]\d{1,2}/.test(raw)) return '';      // dates
    if (NOISE_WORDS.has(raw)) return '';
    return raw.replace(/^[\p{Emoji}\s]+/u, '').trim().slice(0, 30);
}

// ─── Hashing ──────────────────────────────────────────────────────────────────

function djb2(str: string): string {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h) ^ str.charCodeAt(i);
    }
    return (h >>> 0).toString(16);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns typed, stable structural tokens for the current screen.
 * These represent the TEMPLATE, not the specific data on the page.
 */
export function getFingerprintTokens(): string[] {
    const tokens: string[] = [];

    // 1. Normalized URL route — PRIMARY signal
    const route = normalizeUrl(window.location.href);
    tokens.push(`route:${route}`);

    // 2. H1 — page type identity (skip if it's just dynamic data like user names)
    const h1 = document.querySelector('h1');
    if (h1) {
        const h1Text = (h1 as HTMLElement).innerText?.trim().toLowerCase();
        // Skip h1 that looks like dynamic data (numbers, user names with digits, etc)
        if (h1Text && h1Text.length > 1 && h1Text.length < 50 && !/\d{3,}/.test(h1Text)) {
            tokens.push(`h1:${h1Text.slice(0, 30)}`);
        }
    }

    // 3. Form field structure (field names don't change between instances)
    const formFields = Array.from(
        document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="radio"]):not([type="checkbox"]), textarea, select')
    ).slice(0, 8);

    for (const field of formFields) {
        if (isInsideTransient(field)) continue;
        const f = field as HTMLInputElement;
        const key = (f.getAttribute('name') || f.getAttribute('placeholder') || f.getAttribute('aria-label') || '')
            .toLowerCase().trim().slice(0, 25);
        if (key && key.length > 1 && !NOISE_WORDS.has(key)) {
            tokens.push(`field:${key}`);
        }
    }

    // 4. Global nav links (constant across all instances of a template)
    const navLinks = Array.from(document.querySelectorAll('nav a, [role="navigation"] a')).slice(0, 6);
    for (const link of navLinks) {
        if (isInsideTransient(link)) continue;
        const label = cleanLabel(link);
        if (label) tokens.push(`nav:${label}`);
    }

    // 5. Primary action buttons — ONLY from structural chrome, not from list items.
    // We look at buttons that are:
    //   a) In main content
    //   b) NOT inside any repeating list/card
    //   c) NOT inside transient UI
    // This means "Создать статью", "Фильтр", "Экспорт" are captured,
    // but "Читать", "Лайк", "Комментировать" inside article cards are ignored.
    const mainEl = (
        document.querySelector('main') ||
        document.querySelector('[role="main"]') ||
        document.getElementById('root')
    );
    if (mainEl) {
        const btns = Array.from(
            mainEl.querySelectorAll('button:not([aria-hidden="true"]), [role="button"]:not([aria-hidden="true"])')
        )
            .filter(b => !isInsideTransient(b) && !isInsideRepeatingList(b))
            .map(cleanLabel)
            .filter(l => l.length > 1)
            .reduce((acc: string[], l) => (acc.includes(l) ? acc : [...acc, l]), [])
            .slice(0, 3);  // Max 3 structural CTAs
        btns.forEach(l => tokens.push(`btn:${l}`));
    }

    // Deduplicate + sort for stability
    return [...new Set(tokens)].sort().slice(0, 15);
}

/**
 * Generates a stable semantic fingerprint for the current screen template.
 * Identical for /users/123 and /users/456 (same template).
 */
export function getScreenFingerprint(): string {
    const tokens = getFingerprintTokens();
    return `bw-${djb2(tokens.join('|'))}`;
}
