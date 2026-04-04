import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface A11ySettings {
  // Color Adjustment (Tiles from screenshot)
  monochrome: boolean;
  darkHighContrast: boolean;
  brightHighContrast: boolean;
  lowSaturation: boolean;
  highSaturation: boolean;
  contrastMode: boolean;
  
  // Custom Color
  customBgHue: number | null;
  customHeaderHue: number | null;
  customContentHue: number | null;
  activeColorTab: 'background' | 'header' | 'content';

  // Content Adjustment
  textScale: number;
  highlightHeaders: boolean;
  enlargeButtons: boolean;
  textSpacing: boolean;
  dyslexicFont: boolean;
  focusVisualizer: boolean;
  cursorMagnifier: boolean;
  animationsDisabled: boolean;
  linkHighlight: boolean;
}

const STORAGE_KEY = 'bw-a11y-settings-v2';

const DEFAULT_SETTINGS: A11ySettings = {
  monochrome: false,
  darkHighContrast: false,
  brightHighContrast: false,
  lowSaturation: false,
  highSaturation: false,
  contrastMode: false,
  customBgHue: null,
  customHeaderHue: null,
  customContentHue: null,
  activeColorTab: 'background',
  textScale: 1,
  highlightHeaders: false,
  enlargeButtons: false,
  textSpacing: false,
  dyslexicFont: false,
  focusVisualizer: false,
  cursorMagnifier: false,
  animationsDisabled: false,
  linkHighlight: false,
};

export class A11yController implements ReactiveController {
  host: ReactiveControllerHost;
  settings: A11ySettings = { ...DEFAULT_SETTINGS };

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
    this._loadSettings();
  }

  hostConnected() {
    this._applySettings();
  }

  private _loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error('BariWeb: Failed to parse a11y settings', e);
      }
    }
  }

  private _saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    this._applySettings();
    this.host.requestUpdate();
  }

  private _ensureGlobalStyles() {
    const id = 'bw-global-a11y-styles';
    let style = document.getElementById(id) as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }

    style.textContent = `
      /* Global Filters */
      html {
        filter: 
          grayscale(var(--bw-grayscale, 0%)) 
          saturate(var(--bw-saturation, 1)) !important;
        transition: filter 0.3s ease;
      }

      /* Text Spacing */
      html[data-bw-text-spacing], html[data-bw-text-spacing] * {
        line-height: 1.8 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }

      /* Dyslexic Font */
      html[data-bw-dyslexic], html[data-bw-dyslexic] * {
        font-family: "OpenDyslexic", "Comic Sans MS", "Chalkboard SE", sans-serif !important;
      }

      /* Focus Visualizer (Read Focus) - More distinctive */
      html[data-bw-focus-visualizer] *:focus,
      html[data-bw-focus-visualizer] *:focus-visible {
        outline: 8px solid #3b82f6 !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 0 12px rgba(59, 130, 246, 0.4) !important;
        z-index: 99999 !important;
        position: relative;
      }
      html[data-bw-focus-visualizer] *:hover {
        outline: 2px solid rgba(59, 130, 246, 0.3) !important;
        outline-offset: 2px !important;
      }

      /* Cursor Magnifier - Standing out */
      html[data-bw-cursor-magnifier], html[data-bw-cursor-magnifier] * {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='%233b82f6' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z'%3E%3C/path%3E%3Cpath d='M13 13l6 6'%3E%3C/path%3E%3C/svg%3E") 0 0, auto !important;
      }

      /* Link Highlight */
      html[data-bw-link-highlight] a {
        text-decoration: underline !important;
        text-decoration-thickness: 3px !important;
        background-color: #fef08a !important;
        color: #000000 !important;
        padding: 0 4px !important;
        border-radius: 4px !important;
        font-weight: bold !important;
      }

      /* Highlight Headers */
      html[data-bw-highlight-headers] h1,
      html[data-bw-highlight-headers] h2,
      html[data-bw-highlight-headers] h3,
      html[data-bw-highlight-headers] h4,
      html[data-bw-highlight-headers] h5,
      html[data-bw-highlight-headers] h6 {
        background-color: #3b82f6 !important;
        color: #ffffff !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        display: inline-block !important;
      }

      /* Enlarge Buttons */
      html[data-bw-enlarge-buttons] button,
      html[data-bw-enlarge-buttons] [role="button"],
      html[data-bw-enlarge-buttons] input[type="button"],
      html[data-bw-enlarge-buttons] input[type="submit"] {
        transform: scale(1.2) !important;
        margin: 10px !important;
      }

      /* Stop Animations */
      html[data-bw-no-animations], html[data-bw-no-animations] * {
        transition: none !important;
        animation: none !important;
        scroll-behavior: auto !important;
      }

      /* --- High Contrast Modes --- */
      
      /* Dark High Contrast */
      html[data-bw-dark-high-contrast], 
      html[data-bw-dark-high-contrast] body,
      html[data-bw-dark-high-contrast] *:not(bw-widget):not(bw-widget *) {
        background-color: #000000 !important;
        color: #00ff00 !important; /* High-Visibility Green on Black */
        border-color: #00ff00 !important;
        background-image: none !important;
      }
      html[data-bw-dark-high-contrast] a { color: #ffff00 !important; }

      /* Bright High Contrast */
      html[data-bw-bright-high-contrast], 
      html[data-bw-bright-high-contrast] body,
      html[data-bw-bright-high-contrast] *:not(bw-widget):not(bw-widget *) {
        background-color: #ffffff !important;
        color: #000000 !important;
        border-color: #000000 !important;
        background-image: none !important;
      }
      html[data-bw-bright-high-contrast] a { color: #0000ff !important; font-weight: bold !important; }

      /* Contrast Mode (Classic) */
      html[data-bw-contrast-mode], 
      html[data-bw-contrast-mode] body,
      html[data-bw-contrast-mode] *:not(bw-widget):not(bw-widget *) {
        background-color: #000 !important;
        color: #fff !important;
        border-color: #fff !important;
      }

      /* --- Custom Colors --- */
      html[data-bw-has-custom-bg] body,
      html[data-bw-has-custom-bg] *:not(bw-widget):not(bw-widget *) {
        background-color: var(--bw-custom-bg) !important;
        background-image: none !important;
      }
      html[data-bw-has-custom-header] h1,
      html[data-bw-has-custom-header] h2,
      html[data-bw-has-custom-header] h3 {
        color: var(--bw-custom-header) !important;
      }
      html[data-bw-has-custom-content] p,
      html[data-bw-has-custom-content] span,
      html[data-bw-has-custom-content] div:not(bw-widget *) {
        color: var(--bw-custom-content) !important;
      }
    `;
  }

  private _applySettings() {
    const root = document.documentElement;
    this._ensureGlobalStyles();

    // 1. Color Filters
    root.style.setProperty('--bw-grayscale', this.settings.monochrome ? '100%' : '0%');
    
    let sat = 1;
    if (this.settings.lowSaturation) sat = 0.3;
    if (this.settings.highSaturation) sat = 2.5;
    root.style.setProperty('--bw-saturation', sat.toString());
    
    // 2. Custom Colors
    if (this.settings.customBgHue !== null) {
      root.style.setProperty('--bw-custom-bg', `hsl(${this.settings.customBgHue}, 50%, 95%)`);
      root.setAttribute('data-bw-has-custom-bg', '');
    } else {
      root.removeAttribute('data-bw-has-custom-bg');
    }

    if (this.settings.customHeaderHue !== null) {
      root.style.setProperty('--bw-custom-header', `hsl(${this.settings.customHeaderHue}, 70%, 30%)`);
      root.setAttribute('data-bw-has-custom-header', '');
    } else {
      root.removeAttribute('data-bw-has-custom-header');
    }

    if (this.settings.customContentHue !== null) {
      root.style.setProperty('--bw-custom-content', `hsl(${this.settings.customContentHue}, 60%, 40%)`);
      root.setAttribute('data-bw-has-custom-content', '');
    } else {
      root.removeAttribute('data-bw-has-custom-content');
    }

    // 3. Text Scaling
    if (this.settings.textScale > 1) {
      root.style.fontSize = `${this.settings.textScale * 100}%`;
    } else {
      root.style.fontSize = '';
    }

    // 4. Attributes for Global CSS
    const attrs = {
      'data-bw-monochrome': this.settings.monochrome,
      'data-bw-dark-high-contrast': this.settings.darkHighContrast,
      'data-bw-bright-high-contrast': this.settings.brightHighContrast,
      'data-bw-contrast-mode': this.settings.contrastMode,
      'data-bw-text-spacing': this.settings.textSpacing,
      'data-bw-dyslexic': this.settings.dyslexicFont,
      'data-bw-focus-visualizer': this.settings.focusVisualizer,
      'data-bw-cursor-magnifier': this.settings.cursorMagnifier,
      'data-bw-no-animations': this.settings.animationsDisabled,
      'data-bw-link-highlight': this.settings.linkHighlight,
      'data-bw-highlight-headers': this.settings.highlightHeaders,
      'data-bw-enlarge-buttons': this.settings.enlargeButtons,
    };

    Object.entries(attrs).forEach(([key, val]) => {
      if (val) root.setAttribute(key, '');
      else root.removeAttribute(key);
    });

    // Notify host
    const host = (this.host as any) as HTMLElement;
    if (host) {
      host.style.setProperty('--bw-font-scale', this.settings.textScale.toString());
    }
  }

  // --- API ---

  // Color Adjustment
  toggleMonochrome() {
    this.settings.monochrome = !this.settings.monochrome;
    this._saveSettings();
  }

  toggleDarkHighContrast() {
    this.settings.darkHighContrast = !this.settings.darkHighContrast;
    if (this.settings.darkHighContrast) {
      this.settings.brightHighContrast = false;
      this.settings.contrastMode = false;
    }
    this._saveSettings();
  }

  toggleBrightHighContrast() {
    this.settings.brightHighContrast = !this.settings.brightHighContrast;
    if (this.settings.brightHighContrast) {
      this.settings.darkHighContrast = false;
      this.settings.contrastMode = false;
    }
    this._saveSettings();
  }

  toggleLowSaturation() {
    this.settings.lowSaturation = !this.settings.lowSaturation;
    if (this.settings.lowSaturation) this.settings.highSaturation = false;
    this._saveSettings();
  }

  toggleHighSaturation() {
    this.settings.highSaturation = !this.settings.highSaturation;
    if (this.settings.highSaturation) this.settings.lowSaturation = false;
    this._saveSettings();
  }

  toggleContrastMode() {
    this.settings.contrastMode = !this.settings.contrastMode;
    if (this.settings.contrastMode) {
      this.settings.darkHighContrast = false;
      this.settings.brightHighContrast = false;
    }
    this._saveSettings();
  }

  setCustomHue(hue: number) {
    if (this.settings.activeColorTab === 'background') this.settings.customBgHue = hue;
    else if (this.settings.activeColorTab === 'header') this.settings.customHeaderHue = hue;
    else this.settings.customContentHue = hue;
    this._saveSettings();
  }

  resetCustomColors() {
    this.settings.customBgHue = null;
    this.settings.customHeaderHue = null;
    this.settings.customContentHue = null;
    this._saveSettings();
  }

  // Content Adjustment
  toggleHighlightHeaders() {
    this.settings.highlightHeaders = !this.settings.highlightHeaders;
    this._saveSettings();
  }

  toggleEnlargeButtons() {
    this.settings.enlargeButtons = !this.settings.enlargeButtons;
    this._saveSettings();
  }

  incrementTextScale() {
    if (this.settings.textScale >= 1.5) this.settings.textScale = 1.0;
    else this.settings.textScale = parseFloat((this.settings.textScale + 0.1).toFixed(1));
    this._saveSettings();
  }

  toggleTextSpacing() {
    this.settings.textSpacing = !this.settings.textSpacing;
    this._saveSettings();
  }

  toggleDyslexicFont() {
    this.settings.dyslexicFont = !this.settings.dyslexicFont;
    this._saveSettings();
  }

  toggleFocusVisualizer() {
    this.settings.focusVisualizer = !this.settings.focusVisualizer;
    this._saveSettings();
  }

  toggleCursorMagnifier() {
    this.settings.cursorMagnifier = !this.settings.cursorMagnifier;
    this._saveSettings();
  }

  toggleAnimations() {
    this.settings.animationsDisabled = !this.settings.animationsDisabled;
    this._saveSettings();
  }

  toggleLinkHighlight() {
    this.settings.linkHighlight = !this.settings.linkHighlight;
    this._saveSettings();
  }

  reset() {
    this.settings = { ...DEFAULT_SETTINGS };
    this._saveSettings();
  }
}
