import { LitElement, html } from 'lit';
import { customElement, state, query, property } from 'lit/decorators.js';
import { Icons } from './lib/icons.ts';
import { widgetStyles } from './widget.styles.ts';
import { A11yController } from './controllers/a11y.controller.ts';
import { ChatController } from './controllers/chat.controller.ts';
import './components/button/button.js';
import './components/card/card.js';
import './components/accordion/accordion-item.js';

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

  @query('.chat-messages') private _messagesEl!: HTMLElement;

  private _toggle() {
    this._isOpen = !this._isOpen;
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

    const sendIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    const chatIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

    return html`
      <div class="chat-messages">
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
            <h2 class="header-title">BariWeb</h2>
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

          <!-- Chat Panel -->
          <div class="tab-panel" ?active=${this._activeTab === 'chat'}>
            ${this._renderChatTab()}
          </div>

          <!-- A11y Panel -->
          <div class="tab-panel" ?active=${this._activeTab === 'a11y'}>
            ${this._renderA11yTab()}
          </div>

          <div slot="footer" class="footer-content">
            <div class="footer-brand">
              ${Icons.accessibility} BariWeb
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
