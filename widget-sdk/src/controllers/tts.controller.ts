const TTS_STORAGE_KEY = 'bw-tts-enabled-v1';

export class TtsController {
  private enabled = true;

  constructor() {
    this.enabled = this.loadEnabled();
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
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // TTS should never break chat flow.
      console.warn('TTS speak failed', e);
    }
  }

  private loadEnabled(): boolean {
    try {
      const raw = localStorage.getItem(TTS_STORAGE_KEY);
      if (raw === null) return true;
      return raw !== '0';
    } catch {
      return true;
    }
  }

  private detectLanguage(text: string): 'kk-KZ' | 'ru-RU' | 'en-US' {
    const lowered = text.toLowerCase();
    const kazakhChars = /[әіңғүұқөһ]/i;
    const cyrillicChars = /[а-яё]/i;
    const latinChars = /[a-z]/i;

    if (kazakhChars.test(lowered)) return 'kk-KZ';
    if (cyrillicChars.test(lowered)) return 'ru-RU';
    if (latinChars.test(lowered)) return 'en-US';

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
