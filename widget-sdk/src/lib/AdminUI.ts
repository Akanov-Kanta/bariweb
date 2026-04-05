/**
 * AdminUI.ts — Passive Discovery Panel for BariWeb Widget
 *
 * No save button. Admin walks the site, system auto-discovers screens.
 * This panel shows live status: what the system sees and whether it's trained.
 */

import { bariwebWatcher, type DiscoveryResult } from './Watcher.js';
import { getScreenFingerprint, getFingerprintTokens } from './Fingerprint.js';

const PANEL_STYLES = `
  #bw-admin-panel {
    position: fixed;
    bottom: 160px;
    right: 20px;
    z-index: 2147483647;
    width: 320px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 12px 50px rgba(0,0,0,0.6);
    font-family: Inter, system-ui, sans-serif;
    color: #f1f5f9;
    transition: border-color 0.3s;
  }
  #bw-admin-panel.trained {
    border-color: #10b981;
  }
  #bw-admin-panel.discovering {
    border-color: #a78bfa;
  }

  .bw-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .bw-panel-title {
    font-size: 13px;
    font-weight: 700;
    color: #a78bfa;
  }
  .bw-panel-close {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    line-height: 1;
  }
  .bw-panel-close:hover { color: #f87171; }

  .bw-status-box {
    background: #1e293b;
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 12px;
    border: 1px solid #334155;
    transition: all 0.3s;
  }
  .bw-status-box.trained {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.08);
  }
  .bw-status-box.draft {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
  }

  .bw-status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .bw-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .bw-status-dot.active { background: #4ade80; box-shadow: 0 0 8px #4ade80; animation: bw-pulse 2s infinite; }
  .bw-status-dot.draft  { background: #f59e0b; }
  .bw-status-dot.idle   { background: #475569; }

  @keyframes bw-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .bw-status-text {
    font-size: 11px;
    font-weight: 600;
  }
  .bw-status-text.trained { color: #4ade80; }
  .bw-status-text.draft   { color: #f59e0b; }
  .bw-status-text.idle    { color: #94a3b8; }

  .bw-label-display {
    font-size: 14px;
    font-weight: 700;
    color: #e2e8f0;
    margin: 4px 0;
    word-break: break-word;
  }
  .bw-desc-display {
    font-size: 11px;
    color: #94a3b8;
    line-height: 1.4;
    margin-top: 4px;
  }

  .bw-fp-mini {
    font-family: monospace;
    font-size: 9px;
    color: #475569;
    margin-bottom: 10px;
    word-break: break-all;
  }

  .bw-tokens-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .bw-token-tag {
    background: #334155;
    color: #e2e8f0;
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 4px;
    cursor: help;
    transition: all 0.15s;
  }
  .bw-token-tag:hover {
    background: #7c3aed;
    color: white;
    transform: translateY(-1px);
  }

  .bw-discovery-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    background: rgba(167, 139, 250, 0.08);
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 8px;
    font-size: 10px;
    color: #a78bfa;
    margin-top: 8px;
  }
  .bw-discovery-bar .spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(167, 139, 250, 0.3);
    border-top-color: #a78bfa;
    border-radius: 50%;
    animation: bw-spin 0.8s linear infinite;
  }
  @keyframes bw-spin {
    to { transform: rotate(360deg); }
  }

  .bw-highlight-rect {
    position: absolute;
    pointer-events: none;
    border: 2px solid #7c3aed;
    background: rgba(124, 58, 237, 0.1);
    box-shadow: 0 0 10px #7c3aed;
    z-index: 100000;
    border-radius: 4px;
    transition: all 0.15s ease-out;
  }
`;


let panelEl: HTMLElement | null = null;
let currentResult: DiscoveryResult | null = null;

function renderPanel(): void {
    if (!panelEl) return;

    const tokens = getFingerprintTokens();
    const fingerprint = getScreenFingerprint();
    const isTrained = currentResult?.is_trained === true;
    const isDraft = currentResult && !currentResult.is_trained;
    const label = currentResult?.label || null;
    const description = currentResult?.description || null;

    const statusDotClass = isTrained ? 'active' : isDraft ? 'draft' : 'idle';
    const statusTextClass = isTrained ? 'trained' : isDraft ? 'draft' : 'idle';
    const statusLabel = isTrained
        ? '✅ Обучено'
        : isDraft
        ? '📝 Черновик (не подтверждено)'
        : '🔍 Сканирование...';

    const panel = panelEl.querySelector('#bw-admin-panel')!;
    if (panel) {
        panel.className = isTrained ? 'trained' : 'discovering';
        (panel as HTMLElement).id = 'bw-admin-panel';
        if (isTrained) panel.classList.add('trained');
    }

    const content = panelEl.querySelector('#bw-panel-content')!;
    if (!content) return;

    content.innerHTML = `
      <div class="bw-status-box ${isTrained ? 'trained' : isDraft ? 'draft' : ''}">
        <div class="bw-status-indicator">
          <span class="bw-status-dot ${statusDotClass}"></span>
          <span class="bw-status-text ${statusTextClass}">${statusLabel}</span>
        </div>
        ${label ? `<div class="bw-label-display">${label}</div>` : ''}
        ${description ? `<div class="bw-desc-display">${description}</div>` : ''}
      </div>

      <div class="bw-fp-mini">🔑 ${fingerprint}</div>

      <div class="bw-tokens-list">
        ${tokens.map(t => `<span class="bw-token-tag" data-token="${t}">${t}</span>`).join('')}
      </div>

      <div class="bw-discovery-bar">
        <div class="spinner"></div>
        🤖 Система обучается в фоновом режиме...
      </div>
    `;

    // Re-attach token hover handlers
    content.querySelectorAll('.bw-token-tag').forEach(tag => {
        const el = tag as HTMLElement;
        el.onmouseenter = () => highlightElements(el.dataset.token || '');
        el.onmouseleave = () => document.querySelectorAll('.bw-highlight-rect').forEach(h => h.remove());
    });
}

function highlightElements(token: string) {
    document.querySelectorAll('.bw-highlight-rect').forEach(h => h.remove());
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node;
    while (node = walker.nextNode() as HTMLElement) {
        const text = (node.innerText || '').toLowerCase();
        if (text === token.toLowerCase() && node.offsetWidth > 0) {
            const rect = node.getBoundingClientRect();
            const highlight = document.createElement('div');
            highlight.className = 'bw-highlight-rect';
            highlight.style.top = `${rect.top + window.scrollY}px`;
            highlight.style.left = `${rect.left + window.scrollX}px`;
            highlight.style.width = `${rect.width}px`;
            highlight.style.height = `${rect.height}px`;
            document.body.appendChild(highlight);
        }
    }
}


export async function mountAdminPanel(): Promise<void> {
    if (panelEl) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'bw-admin-wrapper';
    wrapper.innerHTML = `
      <style>${PANEL_STYLES}</style>
      <div id="bw-admin-panel">
        <div class="bw-panel-header">
          <span class="bw-panel-title">🧠 Discovery Mode</span>
          <button class="bw-panel-close" id="bw-admin-close">✕</button>
        </div>
        <div id="bw-panel-content"></div>
      </div>
    `;

    document.body.appendChild(wrapper);
    panelEl = wrapper;

    // Close button
    const closeBtn = wrapper.querySelector('#bw-admin-close')!;
    (closeBtn as HTMLElement).onclick = () => {
        panelEl?.remove();
        panelEl = null;
    };

    // Subscribe to discovery results — auto-update panel
    bariwebWatcher.onDiscovery((result: DiscoveryResult) => {
        currentResult = result;
        renderPanel();
    });

    // Initial render (before first discovery callback)
    renderPanel();

    // Force a discovery for the current screen
    await bariwebWatcher.forceDiscovery();
}

export function initAdminMode(): void {
    mountAdminPanel();
}
