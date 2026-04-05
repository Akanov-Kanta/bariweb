/**
 * AdminUI.ts — Admin Training Panel for BariWeb Widget
 *
 * This module is loaded dynamically only after successful admin authentication.
 */

import { bariwebWatcher } from './Watcher.js';
import { getScreenFingerprint, getFingerprintTokens } from './Fingerprint.js';

const ADMIN_API_URL = (window as any).__BARIWEB_API_URL__ || 'http://localhost:8000';

function getClientId(): string {
    const widget = document.querySelector('bw-widget');
    if (widget) {
        const id = (widget as any).clientId || widget.getAttribute('client-id');
        if (id) return id;
    }
    return (window as any).__BARIWEB_CLIENT_ID__ || '';
}

function getAuthHeader(): string {
    const token = localStorage.getItem('bw_admin_token');
    return token ? `Bearer ${token}` : '';
}

const PANEL_STYLES = `
  #bw-admin-panel {
    position: fixed;
    bottom: 160px;
    right: 20px;
    z-index: 2147483647;
    width: 340px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 18px;
    box-shadow: 0 12px 50px rgba(0,0,0,0.6);
    font-family: Inter, system-ui, sans-serif;
    color: #f1f5f9;
  }
  #bw-admin-panel h3 {
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 700;
    color: #a78bfa;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .bw-fp-box {
    background: #1e293b;
    border-radius: 10px;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #334155;
  }
  .bw-fp-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .bw-fp-value { font-family: monospace; font-size: 11px; color: #cbd5e1; word-break: break-all; }
  
  .bw-tokens-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }
  .bw-token-tag {
    background: #334155;
    color: #e2e8f0;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    cursor: help;
    transition: all 0.2s;
  }
  .bw-token-tag:hover {
    background: #7c3aed;
    color: white;
    transform: translateY(-1px);
  }
  
  .bw-input-group { margin-bottom: 12px; }
  .bw-input-label { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
  .bw-input-row { display: flex; gap: 8px; }
  
  #bw-admin-panel input, #bw-admin-panel textarea {
    width: 100%;
    box-sizing: border-box;
    background: #020617;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 9px 12px;
    color: white;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }
  #bw-admin-panel input:focus { border-color: #7c3aed; }
  
  #bw-admin-btn-suggest {
    background: #1e293b;
    border: 1px solid #475569;
    color: #e2e8f0;
    padding: 0 12px;
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
  }
  #bw-admin-btn-suggest:hover { background: #334155; }
  
  #bw-admin-btn-save {
    width: 100%;
    background: #7c3aed;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 11px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  }
  #bw-admin-btn-save:hover { background: #6d28d9; transform: translateY(-1px); }
  
  #bw-admin-status {
    margin-top: 10px;
    font-size: 11px;
    text-align: center;
    min-height: 16px;
  }

  /* Highlight effect for hovered tokens */
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

function createAdminPanel(existingData: any): HTMLElement {
    const snapshot = bariwebWatcher.getLiveSnapshot();
    const tokens = getFingerprintTokens();

    const wrapper = document.createElement('div');
    wrapper.id = 'bw-admin-wrapper';
    wrapper.innerHTML = `
      <style>${PANEL_STYLES}</style>
      <div id="bw-admin-panel">
        <h3>
          🧠 Training Mode
          <button id="bw-admin-close" style="background:none; border:none; color:#64748b; cursor:pointer; font-size:18px;">✕</button>
        </h3>
        
        <div class="bw-fp-box">
          <div class="bw-fp-label">Screen Fingerprint</div>
          <div class="bw-fp-value">${snapshot.fingerprint}</div>
          <div class="bw-tokens-list">
            ${tokens.map(t => `<span class="bw-token-tag" data-token="${t}">${t}</span>`).join('')}
          </div>
        </div>

        <div class="bw-input-group">
          <div class="bw-input-label">Screen Label</div>
          <div class="bw-input-row">
            <input id="bw-admin-label" type="text" placeholder="e.g. Map View" value="${existingData?.label || ''}" />
            <button id="bw-admin-btn-suggest" title="Ask AI for a name">🤖 AI</button>
          </div>
        </div>

        <div class="bw-input-group">
          <div class="bw-input-label">Short Description (for RAG)</div>
          <textarea id="bw-admin-desc" rows="2" placeholder="What can user do here?">${existingData?.description || ''}</textarea>
        </div>

        <button id="bw-admin-btn-save">
          ${existingData ? '🔄 Update Screen Data' : '💾 Save Training Data'}
        </button>
        
        <div id="bw-admin-status"></div>
      </div>
    `;
    return wrapper;
}

/** Visual feedback: find elements on page matching token text and highlight them */
function highlightElements(token: string) {
    // Remove existing highlights
    document.querySelectorAll('.bw-highlight-rect').forEach(h => h.remove());

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node;
    while(node = walker.nextNode() as HTMLElement) {
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

async function suggestName(tokens: string[]): Promise<string> {
    const resp = await fetch(`${ADMIN_API_URL}/v1/training/suggest-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': getAuthHeader() },
        body: JSON.stringify({ tokens })
    });
    if (resp.ok) {
        const data = await resp.json();
        return data.suggestion;
    }
    return '';
}

let panelEl: HTMLElement | null = null;

export async function mountAdminPanel(): Promise<void> {
    if (panelEl) return;

    // Pre-flight check: is this screen already trained?
    let existingData = null;
    try {
        const fingerprint = getScreenFingerprint();
        const resp = await fetch(`${ADMIN_API_URL}/v1/training/match-screen`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Client-ID': getClientId(),
                'Authorization': getAuthHeader()
            },
            body: JSON.stringify({ fingerprint })
        });
        if (resp.ok) {
            const data = await resp.json();
            if (data.matched) existingData = data;
        }
    } catch (e) {}

    panelEl = createAdminPanel(existingData);
    document.body.appendChild(panelEl);

    const closeBtn = panelEl.querySelector('#bw-admin-close') as HTMLButtonElement;
    const saveBtn = panelEl.querySelector('#bw-admin-btn-save') as HTMLButtonElement;
    const suggestBtn = panelEl.querySelector('#bw-admin-btn-suggest') as HTMLButtonElement;
    const labelInput = panelEl.querySelector('#bw-admin-label') as HTMLInputElement;
    const descInput = panelEl.querySelector('#bw-admin-desc') as HTMLTextAreaElement;
    const status = panelEl.querySelector('#bw-admin-status') as HTMLElement;

    // Token hover interaction
    panelEl.querySelectorAll('.bw-token-tag').forEach(tag => {
        const el = tag as HTMLElement;
        el.onmouseenter = () => highlightElements(el.dataset.token || '');
        el.onmouseleave = () => document.querySelectorAll('.bw-highlight-rect').forEach(h => h.remove());
    });

    closeBtn.onclick = () => {
        panelEl?.remove();
        panelEl = null;
    };

    suggestBtn.onclick = async () => {
        suggestBtn.textContent = '...';
        const name = await suggestName(getFingerprintTokens());
        if (name) labelInput.value = name;
        suggestBtn.textContent = '🤖 AI';
    };

    saveBtn.onclick = async () => {
        const label = labelInput.value.trim();
        const description = descInput.value.trim();
        if (!label) {
            status.textContent = '⚠️ Label is required';
            status.style.color = '#f59e0b';
            return;
        }
        
        status.textContent = '⏳ Saving...';
        status.style.color = '#94a3b8';
        
        const ok = await saveTraining(getScreenFingerprint(), label, description);
        if (ok) {
            status.textContent = '✅ Screen data saved successfully!';
            status.style.color = '#4ade80';
        } else {
            status.textContent = '❌ Save failed. Check server logs.';
            status.style.color = '#f87171';
        }
    };
}

async function saveTraining(fingerprint: string, label: string, description: string): Promise<boolean> {
    try {
        const resp = await fetch(`${ADMIN_API_URL}/v1/training/save-screen-context`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-ID': getClientId(),
                'Authorization': getAuthHeader()
            },
            body: JSON.stringify({ fingerprint, label, description, page_url: window.location.href }),
        });
        return resp.ok;
    } catch { return false; }
}

export function initAdminMode(): void {
    // This is called from widget.ts after auth
    mountAdminPanel();
}
