const TTS_STORAGE_KEY = 'bw-tts-enabled-v1';

export class TtsController {
  private enabled = false;

  constructor() {
    this.enabled = this.loadEnabled();
    if ('speechSynthesis' in window) {
      // Warm up voice list in browsers that load voices lazily.
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    try {
      localStorage.setItem(TTS_STORAGE_KEY, value ? '1' : '0');
    } catch {
      // Ignore persistence failures.
    }
    if (!value) {
      this.stop();
    }
  }

  stop(): void {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
  }

  speak(text: string): void {
    if (!this.enabled) return;
    if (!('speechSynthesis' in window)) return;

    const cleanText = (text || '').trim();
    if (!cleanText) return;

    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const lang = this.detectLanguage(cleanText);
      utterance.lang = lang;

      const voice = this.pickVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS speak failed', e);
    }
  }

  private loadEnabled(): boolean {
    try {
      const raw = localStorage.getItem(TTS_STORAGE_KEY);
      if (raw === null) return false;
      return raw !== '0';
    } catch {
      return false;
    }
  }

  private detectLanguage(text: string): 'kk-KZ' | 'ru-RU' | 'en-US' {
    const kazakhChars = /[\u04D8\u04D9\u0492\u0493\u04AE\u04AF\u049A\u049B\u04E8\u04E9\u04BA\u04BB\u0406\u0456\u04A2\u04A3]/u;
    const cyrillicChars = /[\u0400-\u04FF]/u;
    const latinChars = /[a-z]/i;

    if (kazakhChars.test(text)) return 'kk-KZ';
    if (cyrillicChars.test(text)) return 'ru-RU';
    if (latinChars.test(text)) return 'en-US';

    return 'ru-RU';
  }

  private pickVoice(lang: string): SpeechSynthesisVoice | null {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const short = lang.split('-')[0].toLowerCase();
    return (
      voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(short)) ||
      voices[0] ||
      null
    );
  }
}
