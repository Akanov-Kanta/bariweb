import { LitElement, html } from 'lit';
import { customElement, state, query, property } from 'lit/decorators.js';
import { Icons } from './lib/icons.ts';
import { widgetStyles } from './widget.styles.ts';
import { A11yController } from './controllers/a11y.controller.ts';
import { ChatController } from './controllers/chat.controller.ts';
import './components/button/button.js';
import './components/card/card.js';
import './components/accordion/accordion-item.js';
import { bariwebWatcher } from './lib/Watcher.js';


type Tab = 'a11y' | 'chat';

@customElement('bw-widget')
export class BariwebWidget extends LitElement {
  static styles = [widgetStyles];

  private _a11y = new A11yController(this);
  private _chat = new ChatController(this);

  @property({ type: String, attribute: 'client-id' }) clientId = '';

  @state() private _isOpen = false;
  @state() private _activeTab: Tab = 'chat';
  @state() private _inputValue = '';
  
  // Enterprise Auth State
  @state() private _isAdmin = false;
  @state() private _adminPassword = '';
  @state() private _authError = '';
  @state() private _currentScreenLabel = '';

  @query('.chat-messages') private _messagesEl!: HTMLElement;

  constructor() {
    super();
    // No more public initAdminMode() - we only load it via dynamic import after auth
    this._checkAuthStatus();
  }

  private async _checkAuthStatus() {
    const token = localStorage.getItem('bw_admin_token');
    if (!token) return;

    try {
      // Verify the token is still valid against the widget auth endpoint
      const resp = await fetch('http://localhost:8000/auth/login/widget/verify', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        this._isAdmin = true;
        this._loadAdminUI();
      } else {
        localStorage.removeItem('bw_admin_token');
      }
    } catch (e) {
      // If network fails, check token expiry locally (JWT decode without verify)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 > Date.now() && payload.role === 'admin') {
          this._isAdmin = true;
          this._loadAdminUI();
        } else {
          localStorage.removeItem('bw_admin_token');
        }
      } catch {
        localStorage.removeItem('bw_admin_token');
      }
    }
  }

  private async _loadAdminUI() {
    try {
      // Dynamic import for Enterprise security
      const { initAdminMode } = await import('./lib/AdminUI.js');
      initAdminMode();
      bariwebWatcher.isAutoDiscoveryEnabled = true;
    } catch (e) {
      console.error('Failed to load Admin UI', e);
    }
  }

  private async _handleAdminLogin() {
    this._authError = '';
    if (!this.clientId) {
      this._authError = 'Client ID not configured';
      return;
    }
    try {
      // Use the dedicated widget admin login endpoint
      const resp = await fetch('http://localhost:8000/auth/login/widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_public_id: this.clientId,
          admin_key: this._adminPassword,
        })
      });

      if (resp.ok) {
        const { access_token } = await resp.json();
        localStorage.setItem('bw_admin_token', access_token);
        this._isAdmin = true;
        this._loadAdminUI();
      } else {
        const err = await resp.json().catch(() => ({}));
        this._authError = err.detail || 'Invalid admin key';
      }
    } catch (e) {
      this._authError = 'Connection failed';
    }
  }

  private _handleAdminLogout() {
    localStorage.removeItem('bw_admin_token');
    this._isAdmin = false;
    this._adminPassword = '';
    bariwebWatcher.isAutoDiscoveryEnabled = false;
    // Remove the floating admin panel if present
    const panel = document.querySelector('#bw-admin-wrapper');
    if (panel) panel.remove();
  }

  connectedCallback() {
    super.connectedCallback();
    bariwebWatcher.start();
    bariwebWatcher.onStateChange(async (snapshot) => {
      console.log('SPA State Shift Detected:', snapshot.fingerprint);
      
      // Auto-update screen label in UI
      try {
        const resp = await fetch('http://localhost:8000/v1/training/match-screen', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Client-ID': this.clientId || (window as any).__BARIWEB_CLIENT_ID__ || ''
          },
          body: JSON.stringify({ fingerprint: snapshot.fingerprint })
        });
        if (resp.ok) {
          const data = await resp.json();
          this._currentScreenLabel = data.matched ? data.label : '';
        }
      } catch (e) {}
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    bariwebWatcher.stop();
  }


  private _toggle() {
    this._isOpen = !this._isOpen;
  }

  public setOpen(isOpen: boolean) {
    this._isOpen = isOpen;
  }

  private _setTab(tab: Tab) {
    this._activeTab = tab;
  }

  private _getCurrentHue() {
    const s = this._a11y.settings;
    if (s.activeColorTab === 'background') return s.customBgHue || 0;
    if (s.activeColorTab === 'header') return s.customHeaderHue || 0;
    return s.customContentHue || 0;
  }

  private _handleInput(e: InputEvent) {
    this._inputValue = (e.target as HTMLInputElement).value;
  }

  private async _handleSend() {
    const query = this._inputValue.trim();
    if (!query || this._chat.isLoading) return;
    this._inputValue = '';
    await this._chat.sendMessage(query);
    // Scroll to bottom after render
    this.updateComplete.then(() => {
      if (this._messagesEl) {
        this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
      }
    });
  }

  private _handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this._handleSend();
    }
  }

  private _renderChatTab() {
    const messages = this._chat.messages;
    const isLoading = this._chat.isLoading;
    const pending = this._chat.pendingConfirmation;

    const sendIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    const chatIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

    return html`
      <div class="chat-messages">
        ${this._currentScreenLabel ? html`
          <div style="background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.2); border-radius: 8px; padding: 6px 10px; margin-bottom: 10px; font-size: 11px; color: #4ade80; display: flex; align-items: center; gap: 6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Опознано: <strong>${this._currentScreenLabel}</strong>
          </div>
        ` : ''}
        ${messages.length === 0 ? html`
          <div class="chat-empty">
            ${chatIcon}
            <p>Задайте вопрос, и я помогу вам найти нужную информацию или нажать нужную кнопку на странице.</p>
          </div>
        ` : html`
          ${messages.map(msg => html`
            <div class="chat-bubble ${msg.role}">${msg.text}</div>
          `)}
          ${isLoading ? html`
            <div class="typing-indicator">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
            </div>
          ` : ''}
        `}
      </div>

      ${pending ? html`
        <!-- Confirmation buttons — replaces input bar while awaiting user decision -->
        <div style="display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid rgba(255,255,255,0.06);">
          <button
            @click=${() => this._chat.confirmAction()}
            style="flex: 1; padding: 10px; border-radius: 10px; border: 1px solid rgba(74, 222, 128, 0.3); background: rgba(74, 222, 128, 0.1); color: #4ade80; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.15s;"
          >✅ Подтвердить</button>
          <button
            @click=${() => this._chat.cancelAction()}
            style="flex: 1; padding: 10px; border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); color: #ef4444; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.15s;"
          >❌ Отмена</button>
        </div>
      ` : html`
        <div class="chat-input-bar">
          <input
            class="chat-input"
            type="text"
            placeholder="Напишите сообщение..."
            .value=${this._inputValue}
            @input=${this._handleInput}
            @keydown=${this._handleKeydown}
            ?disabled=${isLoading}
            aria-label="Chat input"
          />
          <button
            class="chat-send-btn"
            @click=${this._handleSend}
            ?disabled=${isLoading || !this._inputValue.trim()}
            aria-label="Send message"
          >
            ${sendIcon}
          </button>
        </div>
      `}
    `;
  }

  private _renderA11yTab() {
    const s = this._a11y.settings;
    return html`
      <div style="overflow-y: auto; flex: 1; padding: 0;">
        <nav class="selector-bar" aria-label="Quick Settings">
          <div class="selector-item" role="button" tabindex="0" @click=${() => this._a11y.reset()}>
            ${Icons.close} Сбросить
          </div>
          <div class="selector-item" role="button" tabindex="0">${Icons.languages} Русский</div>
        </nav>

        <bw-accordion-item title="Color Adjustment" open>
          <div class="grid-3" style="margin-top: 0;">
            <bw-button vertical variant="${s.monochrome ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleMonochrome()}>
              <span slot="icon">${Icons.visualImpair}</span>
              Monochrome
              ${s.monochrome ? html`<div class="active-check">${Icons.check}</div>` : ''}
            </bw-button>
            <bw-button vertical variant="${s.darkHighContrast ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleDarkHighContrast()}>
              <span slot="icon">${Icons.moon}</span>
              Dark High-Contrast
              ${s.darkHighContrast ? html`<div class="active-check">${Icons.check}</div>` : ''}
            </bw-button>
            <bw-button vertical variant="${s.brightHighContrast ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleBrightHighContrast()}>
              <span slot="icon">${Icons.sun}</span>
              Bright High-Contrast
              ${s.brightHighContrast ? html`<div class="active-check">${Icons.check}</div>` : ''}
            </bw-button>
            <bw-button vertical variant="${s.lowSaturation ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleLowSaturation()}>
              <span slot="icon">${Icons.droplet}</span>
              Low saturation
              ${s.lowSaturation ? html`<div class="active-check">${Icons.check}</div>` : ''}
            </bw-button>
            <bw-button vertical variant="${s.highSaturation ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleHighSaturation()}>
              <span slot="icon">${Icons.droplet}</span>
              High saturation
              ${s.highSaturation ? html`<div class="active-check">${Icons.check}</div>` : ''}
            </bw-button>
            <bw-button vertical variant="${s.contrastMode ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleContrastMode()}>
              <span slot="icon">${Icons.contrast}</span>
              Contrast Mode
              ${s.contrastMode ? html`<div class="active-check">${Icons.check}</div>` : ''}
            </bw-button>
          </div>

          <div class="color-custom-box">
            <div class="color-custom-header">
              ${Icons.droplet}
              <div>
                <h4 class="color-custom-title">Custom Color</h4>
                <p class="color-custom-subtitle">Change the site's colors</p>
              </div>
            </div>
            
            <div class="color-tabs">
              <div class="color-tab" ?active=${s.activeColorTab === 'background'} @click=${() => { s.activeColorTab = 'background'; this.requestUpdate(); }}>Backgrounds</div>
              <div class="color-tab" ?active=${s.activeColorTab === 'header'} @click=${() => { s.activeColorTab = 'header'; this.requestUpdate(); }}>Headings</div>
              <div class="color-tab" ?active=${s.activeColorTab === 'content'} @click=${() => { s.activeColorTab = 'content'; this.requestUpdate(); }}>Contents</div>
            </div>
            
            <input type="range" min="0" max="360" class="hue-slider" .value=${String(this._getCurrentHue())} @input=${(e: any) => this._a11y.setCustomHue(parseInt(e.target.value))}>
            
            <div class="reset-colors" @click=${() => this._a11y.resetCustomColors()}>
              ${Icons.refresh} Reset colors
            </div>
          </div>
        </bw-accordion-item>

        <bw-accordion-item title="Content Adjustment">
          <div class="grid" style="margin-top: 0;">
            <bw-button vertical variant="${s.textScale > 1 ? 'primary' : 'outline'}" @click=${() => this._a11y.incrementTextScale()}>
              <span slot="icon">${Icons.textSize}</span>
              Текст ${Math.round(s.textScale * 100)}%
            </bw-button>
            <bw-button vertical variant="${s.highlightHeaders ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleHighlightHeaders()}>
              <span slot="icon">${Icons.visualImpair}</span>
              Headers
            </bw-button>
            <bw-button vertical variant="${s.enlargeButtons ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleEnlargeButtons()}>
              <span slot="icon">${Icons.profiles}</span>
              Buttons
            </bw-button>
            <bw-button vertical variant="${s.cursorMagnifier ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleCursorMagnifier()}>
              <span slot="icon">${Icons.cursor}</span>
              Cursor
            </bw-button>
            <bw-button vertical variant="${s.textSpacing ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleTextSpacing()}>
              <span slot="icon">${Icons.textSize}</span>
              Spacing
            </bw-button>
            <bw-button vertical variant="${s.dyslexicFont ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleDyslexicFont()}>
              <span slot="icon">${Icons.textSize}</span>
              Font
            </bw-button>
            <bw-button vertical variant="${s.linkHighlight ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleLinkHighlight()}>
              <span slot="icon">${Icons.visualImpair}</span>
              Links
            </bw-button>
            <bw-button vertical variant="${s.focusVisualizer ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleFocusVisualizer()}>
              <span slot="icon">${Icons.profiles}</span>
              Read Focus
            </bw-button>
            <bw-button vertical variant="${s.animationsDisabled ? 'primary' : 'outline'}" @click=${() => this._a11y.toggleAnimations()}>
              <span slot="icon">${Icons.close}</span>
              Animations
            </bw-button>
          </div>
        </bw-accordion-item>

        <bw-accordion-item title="Admin Access">
          <div style="padding: 10px 0;">
            ${this._isAdmin ? html`
              <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid #334155; border-radius: 10px; padding: 14px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                  <span style="width: 10px; height: 10px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80; animation: bw-dot-pulse 2s infinite;"></span>
                  <span style="color: #4ade80; font-size: 12px; font-weight: 700;">Discovery Mode Active</span>
                </div>
                ${this._currentScreenLabel ? html`
                  <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px; padding: 8px 10px; margin-bottom: 10px;">
                    <div style="font-size: 10px; color: #10b981; font-weight: 600; margin-bottom: 2px;">✅ Текущий экран</div>
                    <div style="font-size: 13px; color: #e2e8f0; font-weight: 700;">${this._currentScreenLabel}</div>
                  </div>
                ` : ''}
                <p style="margin: 0 0 12px; font-size: 11px; color: #64748b; line-height: 1.4;">
                  🤖 Ходите по сайту — система автоматически записывает экраны. Управляйте ими в дашборде.
                </p>
                <button
                  style="width: 100%; background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 8px; padding: 8px; font-size: 12px; cursor: pointer;"
                  @click=${this._handleAdminLogout}
                >
                  Выйти из Admin Mode
                </button>
              </div>
            ` : html`
              <p style="margin: 0 0 12px; font-size: 12px; color: #94a3b8; line-height: 1.4;">Введите admin-ключ для включения автоматического обучения экранов.</p>
              <input
                type="password"
                placeholder="Admin Key"
                style="width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; color: white; margin-bottom: 12px; outline: none;"
                .value=${this._adminPassword}
                @input=${(e: any) => this._adminPassword = e.target.value}
              />
              ${this._authError ? html`<p style="color: #f87171; font-size: 11px; margin-bottom: 10px; text-align: center;">${this._authError}</p>` : ''}
              <button
                style="width: 100%; background: #7c3aed; color: white; border: none; border-radius: 8px; padding: 10px; font-size: 13px; font-weight: 600; cursor: pointer;"
                @click=${this._handleAdminLogin}
              >
                Login to Admin
              </button>
            `}
          </div>
        </bw-accordion-item>
      </div>
    `;
  }

  render() {
    return html`
      <div class="widget-container">
        <bw-card 
          class="${this._isOpen ? 'panel-visible' : 'panel-hidden'}"
          role="dialog"
          aria-label="BariWeb Accessibility & Chat"
        >
          <div slot="header" class="header-content">
            <h2 class="header-title">BariWeb Инклюзия</h2>
            <button 
              class="close-btn" 
              @click=${this._toggle} 
              aria-label="Close menu"
            >
              ${Icons.close}
            </button>
          </div>
 
           <!-- Tab Bar -->
           <div class="tab-bar">
             <div class="tab" ?active=${this._activeTab === 'chat'} @click=${() => this._setTab('chat')}>
               💬 Ассистент
             </div>
             <div class="tab" ?active=${this._activeTab === 'a11y'} @click=${() => this._setTab('a11y')}>
               ♿ Доступность
             </div>
           </div>
 
           <!-- Panel Content -->
           <div class="panel-body" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
             <div class="tab-panel" ?active=${this._activeTab === 'chat'}>
               ${this._renderChatTab()}
             </div>
             <div class="tab-panel" ?active=${this._activeTab === 'a11y'}>
               ${this._renderA11yTab()}
             </div>
           </div>
 
           <div slot="footer" class="footer-content">
             <div class="footer-brand">
               ${Icons.accessibility} Bariweb
             </div>
             <span>Сделано в Казахстане 🇰🇿</span>
           </div>
         </bw-card>
 
         <bw-button 
           circle 
           variant="primary" 
           @click=${this._toggle}
           class="trigger"
           aria-expanded=${this._isOpen}
           aria-label="Toggle BariWeb menu"
         >
           ${this._isOpen ? Icons.close : Icons.accessibility}
         </bw-button>
       </div>
     `;
   }
}
