import type { ReactiveController, ReactiveControllerHost } from 'lit';

// Using the same environment configuration pattern as chat.controller.ts
const API_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:8000';

export class AiA11yController implements ReactiveController {
  host: ReactiveControllerHost;
  isFixing = false;
  simplifyEnabled = false;

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
  }

  hostConnected() {}

  hostDisconnected() {
    if (this.simplifyEnabled) {
      document.body.removeEventListener('click', this._onParagraphClick, { capture: true });
      document.body.classList.remove('bw-simplify-mode');
    }
  }

  async fixMarkup() {
    this.isFixing = true;
    this.host.requestUpdate();

    try {
      const brokenElements: Array<{id: string, html: string}> = [];
      
      // Find Images without alt text
      document.querySelectorAll('img:not([alt]), img[alt=""]').forEach(img => {
        if (!img.hasAttribute('data-bw-ai-id')) {
          img.setAttribute('data-bw-ai-id', 'ai-img-' + Math.random().toString(36).substring(2, 9));
        }
        brokenElements.push({
          id: img.getAttribute('data-bw-ai-id')!,
          // We truncate to avoid sending giant base64 payloads to LLM
          html: img.outerHTML.substring(0, 300) + (img.outerHTML.length > 300 ? '...>' : '')
        });
      });

      // Find Buttons/Links without text AND without aria-label (Icon buttons)
      document.querySelectorAll('button:not([aria-label]), a:not([aria-label]), [role="button"]:not([aria-label])').forEach(btn => {
        // Exclude inputs
        if (btn.tagName === 'INPUT') return;
        
        const htmlEl = btn as HTMLElement;
        const text = htmlEl.innerText?.trim() || htmlEl.textContent?.trim();
        
        // If there's no visible text, it's likely an icon button
        if (!text) {
          if (!btn.hasAttribute('data-bw-ai-id')) {
            btn.setAttribute('data-bw-ai-id', 'ai-btn-' + Math.random().toString(36).substring(2, 9));
          }
          brokenElements.push({
            id: btn.getAttribute('data-bw-ai-id')!,
            html: btn.outerHTML.substring(0, 300) + (btn.outerHTML.length > 300 ? '...>' : '')
          });
        }
      });

      if (brokenElements.length === 0) {
        console.log("BariWeb AI: No broken elements found.");
        return;
      }

      console.log(`BariWeb AI: Found ${brokenElements.length} broken elements. Processing...`);

      const clientId = (window as any).BariwebConfig?.clientId || '';

      // Process in batches of 10 to avoid token limits
      const BATCH_SIZE = 10;
      for (let i = 0; i < brokenElements.length; i += BATCH_SIZE) {
        const batch = brokenElements.slice(i, i + BATCH_SIZE);
        const resp = await fetch(`${API_URL}/v1/widget/a11y/fix`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': clientId
          },
          body: JSON.stringify({ elements: batch })
        });
        
        if (resp.ok) {
          const patches = await resp.json();
          patches.forEach((patch: any) => {
            const el = document.querySelector(`[data-bw-ai-id="${patch.id}"]`);
            if (el && patch.value) {
              if (patch.attribute === 'alt' || patch.attribute === 'aria-label') {
                el.setAttribute(patch.attribute, patch.value);
                // Highlight fixed element for immediate visual feedback
                const htmlEl = el as HTMLElement;
                const oldOutline = htmlEl.style.outline;
                htmlEl.style.outline = '3px solid #10b981';
                setTimeout(() => { htmlEl.style.outline = oldOutline; }, 2000);
              }
            }
          });
        }
      }
    } catch (e) {
      console.error('BariWeb AI: A11y Fix failed', e);
    } finally {
      this.isFixing = false;
      this.host.requestUpdate();
    }
  }

  toggleSimplify() {
    this.simplifyEnabled = !this.simplifyEnabled;
    if (this.simplifyEnabled) {
      document.body.addEventListener('click', this._onParagraphClick, { capture: true });
      document.documentElement.style.setProperty('--bw-simplify-cursor', 'help');
      // Inject global style if not exists
      if (!document.getElementById('bw-simplify-mode-style')) {
        const style = document.createElement('style');
        style.id = 'bw-simplify-mode-style';
        style.textContent = `
          body.bw-simplify-mode *:hover {
            cursor: help !important;
            background-color: rgba(168, 85, 247, 0.1) !important;
            outline: 1px dashed rgba(168, 85, 247, 0.4) !important;
          }
          bw-widget.bw-simplify-mode *:hover, .bw-ai-tooltip *:hover {
            cursor: inherit !important;
            background-color: transparent !important;
            outline: none !important;
          }
          .bw-ai-tooltip {
            position: absolute;
            width: 320px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            color: #0f172a;
            font-family: system-ui, -apple-system, sans-serif;
            z-index: 999999;
            overflow: hidden;
            animation: bwAiFadeIn 0.2s ease-out;
          }
          .bw-ai-tooltip[data-theme="dark"] {
            background: #1e293b;
            border-color: #334155;
            color: #f8fafc;
          }
          .bw-ai-tooltip-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
          }
          .bw-ai-tooltip[data-theme="dark"] .bw-ai-tooltip-header {
            background: #0f172a;
            border-bottom-color: #334155;
            color: #94a3b8;
          }
          .bw-ai-tooltip-close {
            background: transparent;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 14px;
            padding: 2px 6px;
            border-radius: 4px;
          }
          .bw-ai-tooltip-close:hover {
            background: rgba(0,0,0,0.05);
          }
          .bw-ai-tooltip[data-theme="dark"] .bw-ai-tooltip-close:hover {
            background: rgba(255,255,255,0.1);
          }
          .bw-ai-tooltip-content {
            padding: 14px;
            font-size: 14px;
            line-height: 1.6;
          }
          .bw-ai-tooltip-loading .bw-ai-tooltip-content {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #64748b;
            font-style: italic;
            font-size: 13px;
          }
          @keyframes bwAiFadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `;
        document.head.appendChild(style);
      }
      document.body.classList.add('bw-simplify-mode');
    } else {
      document.body.removeEventListener('click', this._onParagraphClick, { capture: true });
      document.body.classList.remove('bw-simplify-mode');
      document.documentElement.style.removeProperty('--bw-simplify-cursor');
    }
    this.host.requestUpdate();
  }

  private _onParagraphClick = async (e: MouseEvent) => {
    // Only capture if mode is active
    if (!this.simplifyEnabled) return;

    const target = e.target as HTMLElement;
    // Don't simplify our own widget interface or existing tooltips
    if (target.closest('bw-widget') || target.closest('.bw-ai-tooltip')) return;

    const tag = target.tagName.toLowerCase();
    // Only intercept clicks on text-heavy elements
    if (['p', 'span', 'div', 'li', 'article', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      const text = target.innerText?.trim();
      // Only simplify text chunks that are somewhat long
      if (text && text.length > 20) {
        e.preventDefault();
        e.stopPropagation();

        // Remove any existing tooltip
        document.querySelectorAll('.bw-ai-tooltip').forEach(el => el.remove());

        // Infer basic theme
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Create tooltip container
        const tooltip = document.createElement('div');
        tooltip.className = 'bw-ai-tooltip bw-ai-tooltip-loading';
        if (isDark) tooltip.setAttribute('data-theme', 'dark');
        
        tooltip.innerHTML = `
          <div class="bw-ai-tooltip-header">
            <span>✨ AI Упрощение</span>
            <button class="bw-ai-tooltip-close">✕</button>
          </div>
          <div class="bw-ai-tooltip-content">
            Ожидаем ответ от ИИ...
          </div>
        `;
        document.body.appendChild(tooltip);

        // Position tooltip near the click
        tooltip.style.left = `${Math.max(10, e.pageX - 160)}px`;
        tooltip.style.top = `${e.pageY + 20}px`;

        // Gentle highlight of original text
        const oldOutline = target.style.outline;
        const oldBg = target.style.backgroundColor;
        target.style.outline = '2px dashed #a855f7';
        target.style.backgroundColor = 'rgba(168, 85, 247, 0.05)';

        // Add close event
        tooltip.querySelector('.bw-ai-tooltip-close')?.addEventListener('click', () => {
          tooltip.remove();
          target.style.outline = oldOutline;
          target.style.backgroundColor = oldBg;
        });

        try {
          const clientId = (window as any).BariwebConfig?.clientId || '';
          const resp = await fetch(`${API_URL}/v1/widget/a11y/simplify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Client-ID': clientId
            },
            body: JSON.stringify({ text })
          });
          
          if (resp.ok) {
            const data = await resp.json();
            if (data.text) {
              tooltip.classList.remove('bw-ai-tooltip-loading');
              tooltip.querySelector('.bw-ai-tooltip-content')!.innerHTML = data.text;
            } else {
              throw new Error("Empty response");
            }
          } else {
            throw new Error("Server error");
          }
        } catch (err) {
          console.error('BariWeb AI: Simplify failed', err);
          tooltip.classList.remove('bw-ai-tooltip-loading');
          tooltip.querySelector('.bw-ai-tooltip-content')!.innerHTML = '<span style="color:#ef4444; font-size:13px;">Ошибка создания упрощенного текста. Попробуйте еще раз.</span>';
        }
      }
    }
  }
}
