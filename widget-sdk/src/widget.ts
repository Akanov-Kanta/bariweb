import { LitElement, html } from 'lit';
import { customElement, state, query, property } from 'lit/decorators.js';
import { Icons } from './lib/icons.ts';
import { widgetStyles } from './widget.styles.ts';
import { A11yController } from './controllers/a11y.controller.ts';
import { AiA11yController } from './controllers/ai-a11y.controller.ts';
import { ChatController, type SttLanguageMode } from './controllers/chat.controller.ts';
import { bariwebWatcher } from './lib/Watcher.js';

type Tab = 'a11y' | 'chat';
type UiLang = 'ru' | 'kz' | 'en';

const STT_LANG_STORAGE_KEY = 'bw-stt-lang-v1';
const STT_SILENCE_CHECK_MS = 200;
const STT_SILENCE_THRESHOLD = 0.015;
const STT_SILENCE_STOP_MS = 1200;
const STT_MAX_DURATION_MS = 20_000;
const STT_MIN_DURATION_MS = 350;

const UI_TEXT: Record<UiLang, Record<string, string>> = {
  ru: {
    announceVoiceInputAvailable: 'Голосовой ввод доступен. Кнопка в нижнем правом углу.',
    announceWidgetOpened: 'Виджет открыт.',
    announceSwitchedToChat: 'Переход в чат. Голосовой ввод доступен.',
    errorMicNotSupported: 'Микрофон не поддерживается.',
    errorNoMicAccess: 'Нет доступа к микрофону.',
    errorProcessing: 'Ошибка обработки.',
    errorTooShort: 'Слишком короткая запись.',
    errorSpeechNotRecognized: 'Речь не распознана.',
    errorRecognition: 'Ошибка распознавания.',
    screenLabelPrefix: 'На странице:',
    chatEmptyTitle: 'Ваш помощник',
    chatEmptySub: 'Опишите задачу — я найду нужные кнопки и заполню поля за вас.',
    confirmAction: 'Подтвердить действие',
    cancel: 'Отменить',
    listening: 'Слушаю... (остановлюсь по тишине)',
    recognizingSpeech: 'Распознаю речь...',
    micAria: 'Включить голосовой ввод (удерживайте для записи)',
    inputPlaceholder: 'Введите сообщение...',
    inputAria: 'Текстовое поле ввода сообщения',
    ttsDisableAria: 'Выключить озвучку ответа',
    ttsEnableAria: 'Включить озвучку ответа',
    sendAria: 'Отправить сообщение',
    tileTextSize: 'Размер текста',
    tileMonochrome: 'Ч/Б',
    valueMonochrome: 'Монохром',
    tileContrast: 'Контраст',
    valueDark: 'Тёмный',
    tileLinks: 'Ссылки',
    valueHighlight: 'Выделить',
    tileSpacing: 'Отступы',
    valueEnlarge: 'Увеличить',
    tileFont: 'Шрифт',
    valueDyslexia: 'Дислексия',
    tileCursor: 'Курсор',
    tileVoice: 'Голос',
    valueRecording: 'Запись...',
    valuePress: 'Нажмите',
    colorSetup: 'Настройка цвета',
    tabBackground: 'Фон',
    tabHeader: 'Шапка',
    tabText: 'Текст',
    decrease: 'Уменьшить',
    hue: 'Оттенок',
    increase: 'Увеличить',
    recognitionLanguage: 'Язык',
    changeRecognitionLanguage: 'Изменить язык распознавания',
    languageAuto: 'Автоопределение',
    languageKz: 'Казахский',
    languageRu: 'Русский',
    languageEn: 'Английский',
    aiSimplify: 'AI Упрощение текста',
    aiBlindMode: 'Режим для незрячих (AI)',
    on: 'ВКЛ',
    off: 'ВЫКЛ',
    resetSettings: 'Сбросить настройки',
    adminMode: 'Режим администратора',
    adminAccess: 'Admin доступ',
    adminLoggedIn: 'Вы вошли как администратор',
    adminLogout: 'Выйти из аккаунта',
    adminPrompt: 'Введите ключ для активации режима обучения',
    adminLogin: 'Войти',
    close: 'Закрыть',
    inclusion: 'Инклюзия',
    tabChat: 'Чат',
    tabSettings: 'Настройки',
    madeInKazakhstan: 'Сделано в Казахстане',
    closeWidgetAria: 'Закрыть',
    widgetDialogAria: 'BariWeb Accessibility Widget',
    triggerAria: 'Открыть/Закрыть меню доступности',
    adminKeyPlaceholder: 'Admin Key',
  },
  kz: {
    announceVoiceInputAvailable: 'Дауыстық енгізу қолжетімді. Түйме төменгі оң жақ бұрышта.',
    announceWidgetOpened: 'Виджет ашылды.',
    announceSwitchedToChat: 'Чатқа ауысты. Дауыстық енгізу қолжетімді.',
    errorMicNotSupported: 'Микрофонға қолдау жоқ.',
    errorNoMicAccess: 'Микрофонға рұқсат жоқ.',
    errorProcessing: 'Өңдеу қатесі.',
    errorTooShort: 'Жазба тым қысқа.',
    errorSpeechNotRecognized: 'Сөйлеу танылмады.',
    errorRecognition: 'Тану қатесі.',
    screenLabelPrefix: 'Бетте:',
    chatEmptyTitle: 'Сіздің көмекшіңіз',
    chatEmptySub: 'Міндетті сипаттаңыз — мен керек батырмаларды тауып, өрістерді толтырамын.',
    confirmAction: 'Әрекетті растау',
    cancel: 'Бас тарту',
    listening: 'Тыңдап тұрмын... (үнсіздікте тоқтаймын)',
    recognizingSpeech: 'Сөйлеуді танып жатырмын...',
    micAria: 'Дауыстық енгізуді қосу (жазу үшін ұстап тұрыңыз)',
    inputPlaceholder: 'Хабарлама енгізіңіз...',
    inputAria: 'Хабарлама енгізу өрісі',
    ttsDisableAria: 'Жауап дауысын өшіру',
    ttsEnableAria: 'Жауап дауысын қосу',
    sendAria: 'Хабарламаны жіберу',
    tileTextSize: 'Мәтін өлшемі',
    tileMonochrome: 'Қ/А',
    valueMonochrome: 'Монохром',
    tileContrast: 'Контраст',
    valueDark: 'Қою',
    tileLinks: 'Сілтемелер',
    valueHighlight: 'Белгілеу',
    tileSpacing: 'Аралықтар',
    valueEnlarge: 'Үлкейту',
    tileFont: 'Қаріп',
    valueDyslexia: 'Дислексия',
    tileCursor: 'Курсор',
    tileVoice: 'Дауыс',
    valueRecording: 'Жазып жатыр...',
    valuePress: 'Басыңыз',
    colorSetup: 'Түсті баптау',
    tabBackground: 'Фон',
    tabHeader: 'Тақырып',
    tabText: 'Мәтін',
    decrease: 'Азайту',
    hue: 'Реңк',
    increase: 'Көбейту',
    recognitionLanguage: 'Тіл',
    changeRecognitionLanguage: 'Тану тілін өзгерту',
    languageAuto: 'Автоанықтау',
    languageKz: 'Қазақша',
    languageRu: 'Орысша',
    languageEn: 'Ағылшынша',
    aiSimplify: 'AI мәтінді жеңілдету',
    aiBlindMode: 'Көру қабілеті нашарларға режим (AI)',
    on: 'ҚОС',
    off: 'ӨШІК',
    resetSettings: 'Баптауларды қалпына келтіру',
    adminMode: 'Әкімші режимі',
    adminAccess: 'Admin қолжетімділігі',
    adminLoggedIn: 'Сіз әкімші ретінде кірдіңіз',
    adminLogout: 'Аккаунттан шығу',
    adminPrompt: 'Оқыту режимін қосу үшін кілт енгізіңіз',
    adminLogin: 'Кіру',
    close: 'Жабу',
    inclusion: 'Инклюзия',
    tabChat: 'Чат',
    tabSettings: 'Баптаулар',
    madeInKazakhstan: 'Қазақстанда жасалған',
    closeWidgetAria: 'Жабу',
    widgetDialogAria: 'BariWeb қолжетімділік виджеті',
    triggerAria: 'Қолжетімділік мәзірін ашу/жабу',
    adminKeyPlaceholder: 'Admin Key',
  },
  en: {
    announceVoiceInputAvailable: 'Voice input is available. The button is in the bottom-right corner.',
    announceWidgetOpened: 'Widget opened.',
    announceSwitchedToChat: 'Switched to chat. Voice input is available.',
    errorMicNotSupported: 'Microphone is not supported.',
    errorNoMicAccess: 'No access to microphone.',
    errorProcessing: 'Processing error.',
    errorTooShort: 'Recording is too short.',
    errorSpeechNotRecognized: 'Speech was not recognized.',
    errorRecognition: 'Recognition error.',
    screenLabelPrefix: 'On page:',
    chatEmptyTitle: 'Your assistant',
    chatEmptySub: 'Describe your task — I will find the right buttons and fill fields for you.',
    confirmAction: 'Confirm action',
    cancel: 'Cancel',
    listening: 'Listening... (will stop on silence)',
    recognizingSpeech: 'Recognizing speech...',
    micAria: 'Enable voice input (hold to record)',
    inputPlaceholder: 'Type a message...',
    inputAria: 'Message input field',
    ttsDisableAria: 'Disable answer voice',
    ttsEnableAria: 'Enable answer voice',
    sendAria: 'Send message',
    tileTextSize: 'Text size',
    tileMonochrome: 'B/W',
    valueMonochrome: 'Monochrome',
    tileContrast: 'Contrast',
    valueDark: 'Dark',
    tileLinks: 'Links',
    valueHighlight: 'Highlight',
    tileSpacing: 'Spacing',
    valueEnlarge: 'Enlarge',
    tileFont: 'Font',
    valueDyslexia: 'Dyslexia',
    tileCursor: 'Cursor',
    tileVoice: 'Voice',
    valueRecording: 'Recording...',
    valuePress: 'Press',
    colorSetup: 'Color setup',
    tabBackground: 'Background',
    tabHeader: 'Header',
    tabText: 'Text',
    decrease: 'Decrease',
    hue: 'Hue',
    increase: 'Increase',
    recognitionLanguage: 'Language',
    changeRecognitionLanguage: 'Change recognition language',
    languageAuto: 'Auto detect',
    languageKz: 'Kazakh',
    languageRu: 'Russian',
    languageEn: 'English',
    aiSimplify: 'AI text simplification',
    aiBlindMode: 'Blind mode (AI)',
    on: 'ON',
    off: 'OFF',
    resetSettings: 'Reset settings',
    adminMode: 'Administrator mode',
    adminAccess: 'Admin access',
    adminLoggedIn: 'You are logged in as administrator',
    adminLogout: 'Log out',
    adminPrompt: 'Enter key to activate training mode',
    adminLogin: 'Log in',
    close: 'Close',
    inclusion: 'Inclusion',
    tabChat: 'Chat',
    tabSettings: 'Settings',
    madeInKazakhstan: 'Made in Kazakhstan',
    closeWidgetAria: 'Close',
    widgetDialogAria: 'BariWeb Accessibility Widget',
    triggerAria: 'Open/close accessibility menu',
    adminKeyPlaceholder: 'Admin Key',
  },
};

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

  private _uiLang(): UiLang {
    if (this._sttLanguageMode === 'kz') return 'kz';
    if (this._sttLanguageMode === 'en') return 'en';
    return 'ru';
  }

  private _t(key: string): string {
    const lang = this._uiLang();
    return UI_TEXT[lang][key] ?? UI_TEXT.ru[key] ?? key;
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
      utterance.lang = this._uiLang() === 'kz' ? 'kk-KZ' : this._uiLang() === 'en' ? 'en-US' : 'ru-RU';
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
      setTimeout(() => this._announce(this._t('announceVoiceInputAvailable')), 500);
      this._scrollMessages();
    }
  }

  public setOpen(v: boolean) {
    this._isOpen = v;
    if (v) {
      this._announce(this._t('announceWidgetOpened'));
      this._scrollMessages();
    }
  }

  private _setTab(tab: Tab) {
    this._activeTab = tab;
    if (tab === 'chat') {
      this._announce(this._t('announceSwitchedToChat'));
      this._scrollMessages();
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
    const sendPromise = this._chat.sendMessage(q, false);
    this._scrollMessages();
    await sendPromise;
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

  private _resetWidgetSettings() {
    this._a11y.reset();
    if (this._aiA11y.simplifyEnabled) this._aiA11y.toggleSimplify();
    if (this._aiA11y.autoA11yEnabled) this._aiA11y.toggleAutoA11y();
    this._setSttLanguageMode('auto');
    this.requestUpdate();
  }

  // в”Ђв”Ђв”Ђ STT в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
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
      this._sttState = 'error'; this._sttError = this._t('errorMicNotSupported'); return;
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
      this._sttState = 'error'; this._sttError = this._t('errorNoMicAccess');
      this._cleanupRecording();
    }
  }

  private _stopRecording() {
    if (this._sttState !== 'recording') return;
    this._clearSttTimers();
    this._sttState = 'processing';
    this._beep(440); // Lower pitch for stop
    this._finalizeRecording().catch(e => {
      this._sttState = 'error'; this._sttError = e?.message || this._t('errorProcessing');
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
      this._sttState = 'error'; this._sttError = this._t('errorTooShort'); return;
    }
    try {
      const res = await this._chat.transcribeAudio(blob, this._sttLanguageMode);
      const text = res.text?.trim();
      if (!text) { this._sttState = 'error'; this._sttError = this._t('errorSpeechNotRecognized'); return; }
      await this._chat.sendMessage(text, true);
      this._sttState = 'idle'; this._sttError = ''; this._inputValue = '';
      this._scrollMessages();
    } catch (e: any) {
      this._sttState = 'error'; this._sttError = e?.message || this._t('errorRecognition');
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

  // в”Ђв”Ђв”Ђ Chat tab в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ  private _renderChatTab() {
    const msgs = this._chat.messages;
    const isLoading = this._chat.isLoading;
    const pending = this._chat.pendingConfirmation;
    const isBusy = isLoading || this._sttState !== 'idle';
    const t = (key: string) => this._t(key);

    return html`
      <div class="chat-messages" id="bw-chat-messages">
        ${this._currentScreenLabel ? html`
          <div class="screen-label-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
            ${t('screenLabelPrefix')} <strong>${this._currentScreenLabel}</strong>
          </div>
        ` : ''}

        ${msgs.length === 0 ? html`
          <div class="chat-empty">
            ${Icons.accessibility}
            <p class="chat-empty-title">${t('chatEmptyTitle')}</p>
            <p class="chat-empty-sub">${t('chatEmptySub')}</p>
          </div>
        ` : msgs.map(msg => {
          const isLog = msg.role === 'assistant' && (
            msg.text.includes('\u2705') ||
            msg.text.includes('\u2328\uFE0F') ||
            msg.text.includes('\uD83D\uDD04')
          );
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
            ${t('confirmAction')}
          </button>
          <button class="btn-cancel" @click=${() => this._chat.cancelAction()} id="bw-cancel-action">
            ${t('cancel')}
          </button>
        </div>
      ` : html`
        <div class="chat-input-area">
          ${this._sttState !== 'idle' ? html`
            <div class="stt-banner ${this._sttState}">
              ${this._sttState === 'recording' ? `REC: ${t('listening')}` :
                this._sttState === 'processing' ? `... ${t('recognizingSpeech')}` :
                `! ${this._sttError}`}
            </div>` : ''}
          <div class="chat-input-row">
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
              aria-label=${t('micAria')}>
              ${Icons.mic}
            </button>

            <input
              class="chat-input"
              type="text"
              placeholder=${t('inputPlaceholder')}
              .value=${this._inputValue}
              @input=${this._handleInput}
              @keydown=${this._handleKeydown}
              ?disabled=${isBusy}
              id="bw-chat-input"
              aria-label=${t('inputAria')}
            />

            <button class="chat-icon-btn ${this._chat.isTtsEnabled() ? 'tts-on' : ''}"
              @click=${() => { this._chat.setTtsEnabled(!this._chat.isTtsEnabled()); this.requestUpdate(); }}
              id="bw-tts-btn"
              aria-label=${this._chat.isTtsEnabled() ? t('ttsDisableAria') : t('ttsEnableAria')}>
              ${this._chat.isTtsEnabled() ? Icons.volumeOn : Icons.volumeOff}
            </button>

            <button class="chat-send-btn" @click=${this._handleSend}
              ?disabled=${!this._inputValue.trim() || isBusy}
              id="bw-send-btn"
              aria-label=${t('sendAria')}>
              ${Icons.send}
            </button>
          </div>
        </div>
      `}
    `;
  }  private _renderA11yTab() {
    const s = this._a11y.settings;
    const t = (key: string) => this._t(key);
    const tiles = [
      {
        id: 'bw-tile-textscale', icon: Icons.textSize,
        label: t('tileTextSize'), value: `${Math.round(s.textScale * 100)}%`,
        active: s.textScale > 1, action: () => this._a11y.incrementTextScale()
      },
      {
        id: 'bw-tile-monochrome', icon: Icons.visualImpair,
        label: t('tileMonochrome'), value: t('valueMonochrome'),
        active: s.monochrome, action: () => this._a11y.toggleMonochrome()
      },
      {
        id: 'bw-tile-contrast', icon: Icons.moon,
        label: t('tileContrast'), value: t('valueDark'),
        active: s.darkHighContrast, action: () => this._a11y.toggleDarkHighContrast()
      },
      {
        id: 'bw-tile-links', icon: Icons.visualImpair,
        label: t('tileLinks'), value: t('valueHighlight'),
        active: s.linkHighlight, action: () => this._a11y.toggleLinkHighlight()
      },
      {
        id: 'bw-tile-spacing', icon: Icons.textSize,
        label: t('tileSpacing'), value: t('valueEnlarge'),
        active: s.textSpacing, action: () => this._a11y.toggleTextSpacing()
      },
      {
        id: 'bw-tile-font', icon: Icons.textSize,
        label: t('tileFont'), value: t('valueDyslexia'),
        active: s.dyslexicFont, action: () => this._a11y.toggleDyslexicFont()
      },
      {
        id: 'bw-tile-cursor', icon: Icons.cursor,
        label: t('tileCursor'), value: t('valueEnlarge'),
        active: s.cursorMagnifier, action: () => this._a11y.toggleCursorMagnifier()
      },
      {
        id: 'bw-tile-voice', icon: null, label: t('tileVoice'),
        value: this._sttState === 'recording' ? t('valueRecording') : t('valuePress'),
        active: this._sttState === 'recording', action: () => this._toggleVoice()
      },
    ];

    return html`
      <div class="a11y-scroller">
        <div class="settings-grid">
          ${tiles.map(ti => html`
            <button class="settings-card" ?active=${ti.active} @click=${ti.action} id=${ti.id}
              aria-pressed=${ti.active ? 'true' : 'false'} aria-label=${ti.label}>
              ${ti.icon || Icons.mic}
              <span class="settings-card-label">${ti.label}</span>
              <span class="settings-card-value">${ti.value}</span>
              ${ti.active ? html`<span class="active-badge">${Icons.check}</span>` : ''}
            </button>
          `)}
        </div>

        <div class="color-section">
          <div class="color-section-header">
            ${Icons.droplet}
            <h4 class="color-section-title">${t('colorSetup')}</h4>
          </div>
          <div class="color-tabs">
            <button class="color-tab" ?active=${s.activeColorTab === 'background'}
              @click=${() => { s.activeColorTab = 'background'; this.requestUpdate(); }}>${t('tabBackground')}</button>
            <button class="color-tab" ?active=${s.activeColorTab === 'header'}
              @click=${() => { s.activeColorTab = 'header'; this.requestUpdate(); }}>${t('tabHeader')}</button>
            <button class="color-tab" ?active=${s.activeColorTab === 'content'}
              @click=${() => { s.activeColorTab = 'content'; this.requestUpdate(); }}>${t('tabText')}</button>
          </div>
          <div class="hue-row">
            <button class="hue-step-btn" @click=${() => this._a11y.setCustomHue((this._getCurrentHue() - 15 + 360) % 360)} aria-label=${t('decrease')}>-</button>
            <input type="range" class="hue-slider" min="0" max="360"
              .value=${String(this._getCurrentHue())}
              @input=${(e: any) => this._a11y.setCustomHue(parseInt(e.target.value))}
              aria-label=${t('hue')} />
            <button class="hue-step-btn" @click=${() => this._a11y.setCustomHue((this._getCurrentHue() + 15) % 360)} aria-label=${t('increase')}>+</button>
          </div>
        </div>

        <div class="ai-tools-section" style="margin-top: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bw-bg-subtle, #f8fafc); border-radius: var(--bw-radius, 14px); margin-bottom: 12px;">
            <div class="lang-row-label" style="display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 14px; color: var(--bw-fg, #1e293b);">
               <span class="lang-row-icon">${Icons.languages}</span>${t('recognitionLanguage')}
            </div>
            <select style="height: 34px; padding: 0 8px; border: 1px solid var(--bw-border); border-radius: 8px; background: #fff; cursor: pointer; outline: none; font-size: 13px;"
              .value=${this._sttLanguageMode}
              @change=${(e: any) => { this._setSttLanguageMode(e.target.value); this.requestUpdate(); }}
              aria-label=${t('changeRecognitionLanguage')}>
              <option value="auto">${t('languageAuto')}</option>
              <option value="kz">${t('languageKz')}</option>
              <option value="ru">${t('languageRu')}</option>
              <option value="en">${t('languageEn')}</option>
            </select>
          </div>

          <button class="ai-tool-btn ${this._aiA11y.simplifyEnabled ? 'active' : ''}"
            @click=${() => this._aiA11y.toggleSimplify()} id="bw-ai-simplify">
            ${Icons.textSize}
            <span class="ai-tool-btn-label">${t('aiSimplify')}</span>
            <span class="ai-tool-badge ${this._aiA11y.simplifyEnabled ? 'on' : ''}">
              ${this._aiA11y.simplifyEnabled ? t('on') : t('off')}
            </span>
          </button>

          <button class="ai-tool-btn ${this._aiA11y.autoA11yEnabled ? 'active' : ''}"
            @click=${() => this._aiA11y.toggleAutoA11y()}
            id="bw-ai-fix">
            ${Icons.accessibility}
            <span class="ai-tool-btn-label">${t('aiBlindMode')}</span>
            <span class="ai-tool-badge ${this._aiA11y.autoA11yEnabled ? 'on' : ''}">
              ${this._aiA11y.autoA11yEnabled ? t('on') : t('off')}
            </span>
          </button>
        </div>

        <div class="settings-actions">
          <button class="reset-settings-btn" @click=${this._resetWidgetSettings} id="bw-reset-settings-btn">
            ${Icons.refresh}
            ${t('resetSettings')}
          </button>
        </div>
      </div>
    `;
  }

  private _renderAdminOverlay() {
    if (!this._showAdminLogin) return '';
    const t = (key: string) => this._t(key);
    return html`
      <div class="admin-overlay">
        <div class="admin-icon">${Icons.shield}</div>
        <h4>${this._isAdmin ? t('adminMode') : t('adminAccess')}</h4>
        ${this._isAdmin ? html`
          <p class="admin-status">${t('adminLoggedIn')}</p>
          <button class="admin-logout-btn" @click=${this._handleAdminLogout}>${t('adminLogout')}</button>
        ` : html`
          <p>${t('adminPrompt')}</p>
          <input type="password" placeholder=${t('adminKeyPlaceholder')}
            .value=${this._adminPassword}
            @input=${(e: any) => { this._adminPassword = e.target.value; }}
            @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._handleAdminLogin(); }} />
          ${this._authError ? html`<p class="auth-error">${this._authError}</p>` : ''}
          <button class="admin-login-btn" @click=${this._handleAdminLogin}>${t('adminLogin')}</button>
        `}
        <button class="admin-close-btn" @click=${() => { this._showAdminLogin = false; this._authError = ''; }}>
          ${t('close')}
        </button>
      </div>
    `;
  }

  render() {
    const t = (key: string) => this._t(key);
    return html`
      <div class="widget-container">
        <div class="bw-panel ${this._isOpen ? 'panel-visible' : 'panel-hidden'}"
          role="dialog" aria-modal="true" aria-label=${t('widgetDialogAria')}>

          <div class="bw-header">
            <div class="header-branding" @click=${this._handleLogoClick} id="bw-logo">
              ${Icons.accessibility}
              <div class="header-branding-text">
                <span class="header-brand-name">BariWeb</span>
                <span class="header-brand-sub">${t('inclusion')}</span>
              </div>
            </div>
            <button class="close-btn" @click=${this._toggle} aria-label=${t('closeWidgetAria')} id="bw-close">
              ${Icons.close}
            </button>
          </div>

          <div class="bw-tabs" role="tablist">
            <button class="bw-tab" ?active=${this._activeTab === 'chat'}
              @click=${() => this._setTab('chat')} role="tab"
              aria-selected=${this._activeTab === 'chat'} id="bw-tab-chat">
              ${Icons.chat} ${t('tabChat')}
            </button>
            <button class="bw-tab" ?active=${this._activeTab === 'a11y'}
              @click=${() => this._setTab('a11y')} role="tab"
              aria-selected=${this._activeTab === 'a11y'} id="bw-tab-settings">
              ${Icons.settings} ${t('tabSettings')}
            </button>
          </div>

          <div class="bw-content">
            <div class="tab-panel" ?active=${this._activeTab === 'chat'} role="tabpanel">
              ${this._renderChatTab()}
            </div>
            <div class="tab-panel" ?active=${this._activeTab === 'a11y'} role="tabpanel">
              ${this._renderA11yTab()}
            </div>
            ${this._renderAdminOverlay()}
          </div>

          <div class="bw-footer" @click=${this._handleLogoClick}>
            <div class="footer-brand">
              ${Icons.accessibility} BariWeb
            </div>
            <span>${t('madeInKazakhstan')}</span>
          </div>
        </div>

        <button class="trigger" @click=${this._toggle}
          aria-expanded=${this._isOpen} aria-label=${t('triggerAria')}
          id="bw-trigger" style="position:fixed; bottom:24px; left:24px; width:60px; height:60px; border-radius:50%; background:var(--bw-primary,#6d28d9); color:white; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; pointer-events:auto; box-shadow:0 4px 20px rgba(109,40,217,0.4); transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;">
          ${this._isOpen ? Icons.close : Icons.accessibility}
        </button>
      </div>
    `;
  }
}

