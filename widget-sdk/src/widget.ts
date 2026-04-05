import { LitElement, html } from 'lit';
import { customElement, state, query, property } from 'lit/decorators.js';
import { Icons } from './lib/icons.ts';
import { widgetStyles } from './widget.styles.ts';
import { A11yController } from './controllers/a11y.controller.ts';
import { AiA11yController } from './controllers/ai-a11y.controller.ts';
import { ChatController, type SttLanguageMode } from './controllers/chat.controller.ts';
import { bariwebWatcher } from './lib/Watcher.js';

type Tab = 'a11y' | 'chat';

const STT_LANG_STORAGE_KEY = 'bw-stt-lang-v1';
const STT_SILENCE_CHECK_MS = 200;
const STT_SILENCE_THRESHOLD = 0.015;
const STT_SILENCE_STOP_MS = 1200;
const STT_MAX_DURATION_MS = 20_000;
const STT_MIN_DURATION_MS = 350;

@customElement('bw-widget')
export class BariwebWidget extends LitElement {
  static styles = [widgetStyles];

  private _a11y = new A11yController(this);
  private _aiA11y = new AiA11yController(this);
  private _chat = new ChatController(this);

  @property({ type: String, attribute: 'client-id' }) clientId = '';

  @state() private _isOpen = false;
  @state() private _activeTab: Tab = 'chat';
  @state() private _inputValue = '';
  @state() private _isAdmin = false;
  @state() private _adminPassword = '';
  @state() private _authError = '';
  @state() private _currentScreenLabel = '';
  @state() private _sttState: 'idle' | 'recording' | 'processing' | 'error' = 'idle';
  @state() private _sttLanguageMode: SttLanguageMode = 'auto';
  @state() private _sttError = '';
  @state() private _adminClickCount = 0;
  @state() private _showAdminLogin = false;

  @query('.chat-messages') private _messagesEl?: HTMLElement;

  // Audio recording
  private _mediaStream: MediaStream | null = null;
  private _audioContext: AudioContext | null = null;
  private _analyser: AnalyserNode | null = null;
  private _scriptProcessor: ScriptProcessorNode | null = null;
  private _pcmChunks: Float32Array[] = [];
  private _sampleRate = 44100;
  private _recordingStartTs = 0;
  private _silenceStartedTs: number | null = null;
  private _silenceIntervalId: number | null = null;
  private _maxDurationTimeoutId: number | null = null;
  private _adminClickTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    try {
      const raw = localStorage.getItem(STT_LANG_STORAGE_KEY);
      if (raw === 'auto' || raw === 'kz' || raw === 'ru' || raw === 'en') this._sttLanguageMode = raw;
    } catch {}
    this._checkAuthStatus();
  }

  private _setSttLanguageMode(mode: SttLanguageMode) {
    this._sttLanguageMode = mode;
    try { localStorage.setItem(STT_LANG_STORAGE_KEY, mode); } catch {}
  }

  private async _checkAuthStatus() {
    const token = localStorage.getItem('bw_admin_token');
    if (!token) return;
    try {
      const resp = await fetch('http://localhost:8000/auth/login/widget/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) { this._isAdmin = true; this._loadAdminUI(); }
      else localStorage.removeItem('bw_admin_token');
    } catch {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now() && payload.role === 'admin') { this._isAdmin = true; this._loadAdminUI(); }
        else localStorage.removeItem('bw_admin_token');
      } catch { localStorage.removeItem('bw_admin_token'); }
    }
  }

  private async _loadAdminUI() {
    try {
      const { initAdminMode } = await import('./lib/AdminUI.js');
      initAdminMode();
      bariwebWatcher.isAutoDiscoveryEnabled = true;
    } catch (e) { console.error('Admin UI load failed', e); }
  }

  private async _handleAdminLogin() {
    this._authError = '';
    if (!this.clientId) { this._authError = 'Client ID not configured'; return; }
    try {
      const resp = await fetch('http://localhost:8000/auth/login/widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_public_id: this.clientId, admin_key: this._adminPassword })
      });
      if (resp.ok) {
        const { access_token } = await resp.json();
        localStorage.setItem('bw_admin_token', access_token);
        this._isAdmin = true;
        this._showAdminLogin = false;
        this._loadAdminUI();
      } else {
        const err = await resp.json().catch(() => ({}));
        this._authError = err.detail || 'Invalid admin key';
      }
    } catch { this._authError = 'Connection failed'; }
  }

  private _handleAdminLogout() {
    localStorage.removeItem('bw_admin_token');
    this._isAdmin = false;
    this._adminPassword = '';
    this._showAdminLogin = false;
    bariwebWatcher.isAutoDiscoveryEnabled = false;
    document.querySelector('#bw-admin-wrapper')?.remove();
  }

  private _handleLogoClick() {
    this._adminClickCount++;
    if (this._adminClickCount >= 5) {
      this._showAdminLogin = !this._showAdminLogin;
      this._adminClickCount = 0;
    }
    if (this._adminClickTimer) clearTimeout(this._adminClickTimer);
    this._adminClickTimer = setTimeout(() => { this._adminClickCount = 0; }, 2000);
  }

  connectedCallback() {
    super.connectedCallback();
    bariwebWatcher.start();
    bariwebWatcher.onStateChange(async (snapshot: any) => {
      try {
        const resp = await fetch('http://localhost:8000/v1/training/match-screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Client-ID': this.clientId || (window as any).__BARIWEB_CLIENT_ID__ || '' },
          body: JSON.stringify({ fingerprint: snapshot.fingerprint })
        });
        if (resp.ok) {
          const data = await resp.json();
          this._currentScreenLabel = data.matched ? data.label : '';
        }
      } catch {}
    });

    window.addEventListener('keydown', this._handleGlobalKeydown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    bariwebWatcher.stop();
    this._cleanupRecording();
    window.removeEventListener('keydown', this._handleGlobalKeydown);
  }

  private _handleGlobalKeydown = (e: KeyboardEvent) => {
    // Alt + V to toggle voice (if widget is open)
    if (this._isOpen && e.altKey && e.code === 'KeyV') {
      e.preventDefault();
      this._toggleVoice();
    }
  };

  private _announce(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU'; // Defaulting to RU as it's the primary market
      window.speechSynthesis.speak(utterance);
    }
  }

  private _beep(freq: number) {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  private _toggle() { 
    this._isOpen = !this._isOpen; 
    if (this._isOpen) {
      setTimeout(() => this._announce('Голосовой ввод доступен. Кнопка в нижнем правом углу.'), 500);
    }
  }
  public setOpen(v: boolean) { this._isOpen = v; if (v) this._announce('Виджет открыт.'); }
  private _setTab(tab: Tab) { 
    this._activeTab = tab; 
    if (tab === 'chat') {
      this._announce('Переход в чат. Голосовой ввод доступен.');
    }
  }

  private _handleInput(e: InputEvent) { this._inputValue = (e.target as HTMLInputElement).value; }
  private _handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      this._handleSend(); 
    }
    // Space to activate mic when not typing
    if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
      e.preventDefault();
      if (this._sttState === 'idle') this._startRecording();
    }
  }
  private async _handleSend() {
    const q = this._inputValue.trim();
    if (!q || this._chat.isLoading || this._sttState !== 'idle') return;
    this._inputValue = '';
    await this._chat.sendMessage(q, false);
    this._scrollMessages();
  }
  private _scrollMessages() {
    this.updateComplete.then(() => {
      if (this._messagesEl) this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
    });
  }

  private _getCurrentHue() {
    const s = this._a11y.settings;
    if (s.activeColorTab === 'background') return s.customBgHue || 0;
    if (s.activeColorTab === 'header') return s.customHeaderHue || 0;
    return s.customContentHue || 0;
  }

  // ─── STT ───────────────────────────────────
  private _clearSttTimers() {
    if (this._silenceIntervalId !== null) { window.clearInterval(this._silenceIntervalId); this._silenceIntervalId = null; }
    if (this._maxDurationTimeoutId !== null) { window.clearTimeout(this._maxDurationTimeoutId); this._maxDurationTimeoutId = null; }
  }

  private _cleanupRecording() {
    this._clearSttTimers();
    this._analyser = null;
    if (this._scriptProcessor) { this._scriptProcessor.disconnect(); this._scriptProcessor.onaudioprocess = null; this._scriptProcessor = null; }
    if (this._audioContext) { this._audioContext.close().catch(() => {}); this._audioContext = null; }
    if (this._mediaStream) { this._mediaStream.getTracks().forEach(t => t.stop()); this._mediaStream = null; }
    this._pcmChunks = [];
    this._silenceStartedTs = null;
  }

  private async _toggleVoice() {
    if (this._sttState === 'processing') return;
    if (this._sttState === 'recording') { this._stopRecording(); return; }
    await this._startRecording();
  }

  private async _startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      this._sttState = 'error'; this._sttError = 'Микрофон не поддерживается.'; return;
    }
    try {
      this._cleanupRecording();
      this._sttError = '';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._mediaStream = stream;
      this._pcmChunks = [];
      this._recordingStartTs = Date.now();
      this._silenceStartedTs = null;
      this._audioContext = new AudioContext();
      this._sampleRate = this._audioContext.sampleRate;
      const source = this._audioContext.createMediaStreamSource(stream);
      this._analyser = this._audioContext.createAnalyser();
      this._analyser.fftSize = 2048;
      source.connect(this._analyser);
      this._scriptProcessor = this._audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(this._scriptProcessor);
      this._scriptProcessor.connect(this._audioContext.destination);
      this._scriptProcessor.onaudioprocess = (ev) => {
        if (this._sttState !== 'recording') return;
        this._pcmChunks.push(new Float32Array(ev.inputBuffer.getChannelData(0)));
        ev.outputBuffer.getChannelData(0).fill(0);
      };
      this._sttState = 'recording';
      this._beep(880); // Higher pitch for start
      this._maxDurationTimeoutId = window.setTimeout(() => {
        if (this._sttState === 'recording') this._stopRecording();
      }, STT_MAX_DURATION_MS);
      const buf = new Uint8Array(this._analyser.fftSize);
      this._silenceIntervalId = window.setInterval(() => {
        if (!this._analyser || this._sttState !== 'recording') return;
        this._analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const n = (buf[i] - 128) / 128; sum += n * n; }
        const rms = Math.sqrt(sum / buf.length);
        if (rms < STT_SILENCE_THRESHOLD) {
          if (!this._silenceStartedTs) this._silenceStartedTs = Date.now();
          else if (Date.now() - this._silenceStartedTs >= STT_SILENCE_STOP_MS) this._stopRecording();
        } else { this._silenceStartedTs = null; }
      }, STT_SILENCE_CHECK_MS);
    } catch {
      this._sttState = 'error'; this._sttError = 'Нет доступа к микрофону.';
      this._cleanupRecording();
    }
  }

  private _stopRecording() {
    if (this._sttState !== 'recording') return;
    this._clearSttTimers();
    this._sttState = 'processing';
    this._beep(440); // Lower pitch for stop
    this._finalizeRecording().catch(e => {
      this._sttState = 'error'; this._sttError = e?.message || 'Ошибка обработки.';
    });
  }

  private async _finalizeRecording() {
    const dur = Date.now() - this._recordingStartTs;
    const total = this._pcmChunks.reduce((s, a) => s + a.length, 0);
    const merged = new Float32Array(total);
    let off = 0;
    for (const c of this._pcmChunks) { merged.set(c, off); off += c.length; }
    const blob = this._encodeWav(merged, this._sampleRate);
    this._cleanupRecording();
    if (dur < STT_MIN_DURATION_MS || blob.size === 0) {
      this._sttState = 'error'; this._sttError = 'Слишком короткая запись.'; return;
    }
    try {
      const res = await this._chat.transcribeAudio(blob, this._sttLanguageMode);
      const text = res.text?.trim();
      if (!text) { this._sttState = 'error'; this._sttError = 'Речь не распознана.'; return; }
      await this._chat.sendMessage(text, true);
      this._sttState = 'idle'; this._sttError = ''; this._inputValue = '';
      this._scrollMessages();
    } catch (e: any) {
      this._sttState = 'error'; this._sttError = e?.message || 'Ошибка распознавания.';
    }
  }

  private _encodeWav(samples: Float32Array, sr: number): Blob {
    const bps = 2, ba = bps, brate = sr * ba, ds = samples.length * bps;
    const buf = new ArrayBuffer(44 + ds); const v = new DataView(buf);
    const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + ds, true); ws(8, 'WAVE'); ws(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, brate, true);
    v.setUint16(32, ba, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, ds, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      v.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true); offset += 2;
    }
    return new Blob([buf], { type: 'audio/wav' });
  }

  private _vibrate() {
    if ('vibrate' in navigator) navigator.vibrate(20);
  }

  // ─── Chat tab ──────────────────────────────
  private _renderChatTab() {
    const msgs = this._chat.messages;
    const isLoading = this._chat.isLoading;
    const pending = this._chat.pendingConfirmation;
    const isBusy = isLoading || this._sttState !== 'idle';

    return html`
      <div class="chat-messages" id="bw-chat-messages">
        ${this._currentScreenLabel ? html`
          <div class="screen-label-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
            На странице: <strong>${this._currentScreenLabel}</strong>
          </div>
        ` : ''}

        ${msgs.length === 0 ? html`
          <div class="chat-empty">
            ${Icons.accessibility}
            <p class="chat-empty-title">Ваш помощник</p>
            <p class="chat-empty-sub">Опишите задачу — я найду нужные кнопки и заполню поля за вас.</p>
          </div>
        ` : msgs.map(msg => {
          const isLog = msg.role === 'assistant' && (msg.text.includes('✅') || msg.text.includes('⌨️') || msg.text.includes('🔄'));
          if (isLog) {
            const short = msg.text.split('\n')[0];
            return html`
              <details class="system-log">
                <summary class="system-log-header"><span>${short}</span></summary>
                <div class="system-log-details">${msg.text}</div>
              </details>`;
          }
          return html`<div class="chat-bubble ${msg.role}">${msg.text}</div>`;
        })}

        ${isLoading ? html`
          <div class="typing-indicator">
            <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
          </div>` : ''}
      </div>

      ${pending ? html`
        <div class="confirm-panel">
          <button class="btn-confirm" @click=${() => this._chat.confirmAction()} id="bw-confirm-action">
            ✅ Подтвердить действие
          </button>
          <button class="btn-cancel" @click=${() => this._chat.cancelAction()} id="bw-cancel-action">
            Отменить
          </button>
        </div>
      ` : html`
        <div class="chat-input-area">
          ${this._sttState !== 'idle' ? html`
            <div class="stt-banner ${this._sttState}">
              ${this._sttState === 'recording' ? '🎙️ Слушаю... (остановлюсь по тишине)' :
                this._sttState === 'processing' ? '⏳ Распознаю речь...' :
                `⚠️ ${this._sttError}`}
            </div>` : ''}
          <div class="chat-input-row">
            <!-- 🎙️ Primary Mic Button (Large Target Size) -->
            <button class="chat-icon-btn ${this._sttState === 'recording' ? 'recording' : ''}"
              @mouseenter=${this._vibrate}
              @focus=${this._vibrate}
              @mousedown=${this._startRecording}
              @mouseup=${this._stopRecording}
              @touchstart=${(e: Event) => { e.preventDefault(); this._startRecording(); this._vibrate(); }}
              @touchend=${(e: Event) => { e.preventDefault(); this._stopRecording(); }}
              @click=${this._toggleVoice} 
              ?disabled=${this._sttState === 'processing' || isLoading}
              id="bw-voice-btn" 
              aria-label="Включить голосовой ввод (удерживайте для записи)">
              ${Icons.mic}
            </button>

            <input
              class="chat-input"
              type="text"
              placeholder="Введите сообщение..."
              .value=${this._inputValue}
              @input=${this._handleInput}
              @keydown=${this._handleKeydown}
              ?disabled=${isBusy}
              id="bw-chat-input"
              aria-label="Текстовое поле ввода сообщения"
            />

            <!-- 🔊 TTS Toggle -->
            <button class="chat-icon-btn ${this._chat.isTtsEnabled() ? 'tts-on' : ''}"
              @click=${() => { this._chat.setTtsEnabled(!this._chat.isTtsEnabled()); this.requestUpdate(); }}
              id="bw-tts-btn" 
              aria-label="${this._chat.isTtsEnabled() ? 'Выключить озвучку ответа' : 'Включить озвучку ответа'}">
              ${this._chat.isTtsEnabled() ? '🔊' : '🔇'}
            </button>

            <!-- ▶ Send Button -->
            <button class="chat-send-btn" @click=${this._handleSend}
              ?disabled=${!this._inputValue.trim() || isBusy}
              id="bw-send-btn" 
              aria-label="Отправить сообщение">
              ${Icons.send}
            </button>
          </div>
        </div>
      `}
    `;
  }

  // ─── Settings tab ──────────────────────────
  private _renderA11yTab() {
    const s = this._a11y.settings;
    const tiles = [
      {
        id: 'bw-tile-textscale', icon: Icons.textSize,
        label: 'Размер текста', value: `${Math.round(s.textScale * 100)}%`,
        active: s.textScale > 1, action: () => this._a11y.incrementTextScale()
      },
      {
        id: 'bw-tile-monochrome', icon: Icons.visualImpair,
        label: 'Ч/Б', value: 'Монохром',
        active: s.monochrome, action: () => this._a11y.toggleMonochrome()
      },
      {
        id: 'bw-tile-contrast', icon: Icons.moon,
        label: 'Контраст', value: 'Тёмный',
        active: s.darkHighContrast, action: () => this._a11y.toggleDarkHighContrast()
      },
      {
        id: 'bw-tile-links', icon: Icons.visualImpair,
        label: 'Ссылки', value: 'Выделить',
        active: s.linkHighlight, action: () => this._a11y.toggleLinkHighlight()
      },
      {
        id: 'bw-tile-spacing', icon: Icons.textSize,
        label: 'Отступы', value: 'Увеличить',
        active: s.textSpacing, action: () => this._a11y.toggleTextSpacing()
      },
      {
        id: 'bw-tile-font', icon: Icons.textSize,
        label: 'Шрифт', value: 'Дислексия',
        active: s.dyslexicFont, action: () => this._a11y.toggleDyslexicFont()
      },
      {
        id: 'bw-tile-cursor', icon: Icons.cursor,
        label: 'Курсор', value: 'Увеличить',
        active: s.cursorMagnifier, action: () => this._a11y.toggleCursorMagnifier()
      },
      {
        id: 'bw-tile-voice', icon: null, label: 'Голос',
        value: this._sttState === 'recording' ? 'Запись...' : 'Нажмите',
        active: this._sttState === 'recording', action: () => this._toggleVoice()
      },
    ];

    return html`
      <div class="a11y-scroller">
        <div class="settings-grid">
          ${tiles.map(t => html`
            <button class="settings-card" ?active=${t.active} @click=${t.action} id=${t.id}
              aria-pressed=${t.active ? 'true' : 'false'} aria-label=${t.label}>
              ${t.icon || Icons.mic}
              <span class="settings-card-label">${t.label}</span>
              <span class="settings-card-value">${t.value}</span>
              ${t.active ? html`<span class="active-badge">${Icons.check}</span>` : ''}
            </button>
          `)}
        </div>

        <div class="color-section">
          <div class="color-section-header">
            ${Icons.droplet}
            <h4 class="color-section-title">Настройка цвета</h4>
          </div>
          <div class="color-tabs">
            <button class="color-tab" ?active=${s.activeColorTab === 'background'}
              @click=${() => { s.activeColorTab = 'background'; this.requestUpdate(); }}>Фон</button>
            <button class="color-tab" ?active=${s.activeColorTab === 'header'}
              @click=${() => { s.activeColorTab = 'header'; this.requestUpdate(); }}>Шапка</button>
            <button class="color-tab" ?active=${s.activeColorTab === 'content'}
              @click=${() => { s.activeColorTab = 'content'; this.requestUpdate(); }}>Текст</button>
          </div>
          <div class="hue-row">
            <button class="hue-step-btn" @click=${() => this._a11y.setCustomHue((this._getCurrentHue() - 15 + 360) % 360)} aria-label="Уменьшить">–</button>
            <input type="range" class="hue-slider" min="0" max="360"
              .value=${String(this._getCurrentHue())}
              @input=${(e: any) => this._a11y.setCustomHue(parseInt(e.target.value))}
              aria-label="Оттенок" />
            <button class="hue-step-btn" @click=${() => this._a11y.setCustomHue((this._getCurrentHue() + 15) % 360)} aria-label="Увеличить">+</button>
          </div>
        </div>

        <div class="ai-tools-section" style="margin-top: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bw-bg-subtle, #f8fafc); border-radius: var(--bw-radius, 14px); margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 14px; color: var(--bw-fg, #1e293b);">
               ${Icons.languages} Язык распознавания
            </div>
            <select style="height: 34px; padding: 0 8px; border: 1px solid var(--bw-border); border-radius: 8px; background: #fff; cursor: pointer; outline: none; font-size: 13px;"
              .value=${this._sttLanguageMode}
              @change=${(e: any) => { this._setSttLanguageMode(e.target.value); this.requestUpdate(); }}
              aria-label="Изменить язык распознавания">
              <option value="auto">Автоопределение</option>
              <option value="kz">Казахский</option>
              <option value="ru">Русский</option>
              <option value="en">Английский</option>
            </select>
          </div>

          <button class="ai-tool-btn ${this._aiA11y.simplifyEnabled ? 'active' : ''}"
            @click=${() => this._aiA11y.toggleSimplify()} id="bw-ai-simplify">
            ${Icons.textSize}
            <span class="ai-tool-btn-label">AI Упрощение текста</span>
            <span class="ai-tool-badge ${this._aiA11y.simplifyEnabled ? 'on' : ''}">
              ${this._aiA11y.simplifyEnabled ? 'ВКЛ' : 'ВЫКЛ'}
            </span>
          </button>
          
          <button class="ai-tool-btn ${this._aiA11y.autoA11yEnabled ? 'active' : ''}"
            @click=${() => this._aiA11y.toggleAutoA11y()} 
            id="bw-ai-fix">
            ${Icons.accessibility}
            <span class="ai-tool-btn-label">Режим для незрячих (AI)</span>
            <span class="ai-tool-badge ${this._aiA11y.autoA11yEnabled ? 'on' : ''}">
              ${this._aiA11y.autoA11yEnabled ? 'ВКЛ' : 'ВЫКЛ'}
            </span>
          </button>
        </div>
      </div>
    `;
  }

  // ─── Admin overlay ─────────────────────────
  private _renderAdminOverlay() {
    if (!this._showAdminLogin) return '';
    return html`
      <div class="admin-overlay">
        <div class="admin-icon">🔐</div>
        <h4>${this._isAdmin ? 'Режим администратора' : 'Admin доступ'}</h4>
        ${this._isAdmin ? html`
          <p class="admin-status">✅ Вы вошли как администратор</p>
          <button class="admin-logout-btn" @click=${this._handleAdminLogout}>Выйти из аккаунта</button>
        ` : html`
          <p>Введите ключ для активации режима обучения</p>
          <input type="password" placeholder="Admin Key"
            .value=${this._adminPassword}
            @input=${(e: any) => { this._adminPassword = e.target.value; }}
            @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._handleAdminLogin(); }} />
          ${this._authError ? html`<p class="auth-error">${this._authError}</p>` : ''}
          <button class="admin-login-btn" @click=${this._handleAdminLogin}>Войти</button>
        `}
        <button class="admin-close-btn" @click=${() => { this._showAdminLogin = false; this._authError = ''; }}>
          Закрыть
        </button>
      </div>
    `;
  }

  render() {
    return html`
      <div class="widget-container">
        <!-- Panel -->
        <div class="bw-panel ${this._isOpen ? 'panel-visible' : 'panel-hidden'}"
          role="dialog" aria-modal="true" aria-label="BariWeb Accessibility Widget">

          <!-- Header -->
          <div class="bw-header">
            <div class="header-branding" @click=${this._handleLogoClick} id="bw-logo">
              ${Icons.accessibility}
              <div class="header-branding-text">
                <span class="header-brand-name">BariWeb</span>
                <span class="header-brand-sub">Инклюзия</span>
              </div>
            </div>
            <button class="close-btn" @click=${this._toggle} aria-label="Закрыть" id="bw-close">
              ${Icons.close}
            </button>
          </div>

          <!-- Tabs -->
          <div class="bw-tabs" role="tablist">
            <button class="bw-tab" ?active=${this._activeTab === 'chat'}
              @click=${() => this._setTab('chat')} role="tab"
              aria-selected=${this._activeTab === 'chat'} id="bw-tab-chat">
              💬 Чат
            </button>
            <button class="bw-tab" ?active=${this._activeTab === 'a11y'}
              @click=${() => this._setTab('a11y')} role="tab"
              aria-selected=${this._activeTab === 'a11y'} id="bw-tab-settings">
              ♿ Настройки
            </button>
          </div>

          <!-- Content -->
          <div class="bw-content">
            <div class="tab-panel" ?active=${this._activeTab === 'chat'} role="tabpanel">
              ${this._renderChatTab()}
            </div>
            <div class="tab-panel" ?active=${this._activeTab === 'a11y'} role="tabpanel">
              ${this._renderA11yTab()}
            </div>
            ${this._renderAdminOverlay()}
          </div>

          <!-- Footer -->
          <div class="bw-footer" @click=${this._handleLogoClick}>
            <div class="footer-brand">
              ${Icons.accessibility} BariWeb
            </div>
            <span>Сделано в Казахстане 🇰🇿</span>
          </div>
        </div>

        <!-- FAB Trigger -->
        <button class="trigger" @click=${this._toggle}
          aria-expanded=${this._isOpen} aria-label="Открыть/Закрыть меню доступности"
          id="bw-trigger" style="position:fixed; bottom:24px; left:24px; width:60px; height:60px; border-radius:50%; background:var(--bw-primary,#6d28d9); color:white; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; pointer-events:auto; box-shadow:0 4px 20px rgba(109,40,217,0.4); transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;">
          ${this._isOpen ? Icons.close : Icons.accessibility}
        </button>
      </div>
    `;
  }
}
