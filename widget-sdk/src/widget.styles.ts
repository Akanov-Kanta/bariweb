import { css } from 'lit';

export const widgetStyles = css`
  :host {
    display: block;
    pointer-events: none;
    user-select: none;
    
    /* Убиваем тени на корню через переменные */
    --bw-shadow: none !important;
    --bw-shadow-lg: none !important;
    --bw-card-shadow: none !important;

    --bw-primary: var(--bw-primary-color, #18181b);
    --bw-primary-fg: var(--bw-primary-fg-color, #ffffff);
    --bw-bg: var(--bw-bg-color, #ffffff);
    --bw-fg: var(--bw-fg-color, #09090b);
    --bw-border: var(--bw-border-color, #e4e4e7);
    --bw-radius: var(--bw-radius-size, 1rem);
    --bw-bg-hover: #f4f4f5;
    
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* --- Accessibility Themes & Toggles --- */

  /* High Contrast Theme */
  :host([data-contrast="high"]) {
    --bw-bg: #000000;
    --bw-fg: #ffff00;
    --bw-primary: #ffffff;
    --bw-border: #ffffff;
    --bw-bg-hover: #1a1a1a;
    --bw-primary-fg: #000000;
  }

  /* Light Contrast Theme */
  :host([data-contrast="light"]) {
    --bw-bg: #f8fafc;
    --bw-fg: #64748b;
    --bw-primary: #94a3b8;
    --bw-border: #e2e8f0;
    --bw-bg-hover: #ffffff;
  }

  /* Text Spacing */
  :host([data-text-spacing]) {
    line-height: var(--bw-line-height) !important;
    letter-spacing: var(--bw-letter-spacing) !important;
    word-spacing: var(--bw-word-spacing) !important;
  }

  /* Dyslexic Font */
  :host([data-dyslexic]) {
    font-family: "Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif !important;
  }

  /* Focus Visualizer */
  :host([data-focus-visualizer]) *:focus-visible {
    outline: 4px solid #f59e0b !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.3) !important;
  }

  /* Cursor Magnifier */
  :host([data-cursor-magnifier]) {
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z'%3E%3C/path%3E%3Cpath d='M13 13l6 6'%3E%3C/path%3E%3C/svg%3E"), auto !important;
  }

  /* Pause Animations */
  :host([data-no-animations]) *,
  :host([data-no-animations]) {
    transition: none !important;
    animation: none !important;
  }

  /* Link Highlight */
  :host([data-link-highlight]) a {
    text-decoration: underline !important;
    text-decoration-thickness: 2px !important;
    background-color: #fef08a !important;
    color: #000000 !important;
    padding: 0 2px !important;
    border-radius: 2px !important;
  }

  /* --- Base Layout --- */

  /* The trigger button */
  .trigger {
    position: fixed;
    bottom: 2rem;
    left: 2rem;
    width: var(--bw-trigger-size, 64px);
    height: var(--bw-trigger-size, 64px);
    pointer-events: auto;
    transition: transform 0.3s ease, opacity 0.3s ease;
    /* Убираем тень, если она была у кнопки */
    box-shadow: none !important; 
  }

  /* The sliding sidebar panel */
  bw-card {
    all: initial;
    display: flex;
    flex-direction: column;
    
    /* ГАРАНТИРОВАННОЕ ОТСУТСТВИЕ ТЕНИ */
    box-shadow: none !important;
    --bw-card-shadow: none !important;
    --bw-shadow: none !important;
    
    position: fixed;
    top: 0;
    left: 0;
    min-width: 420px;
    width: 35vw; 
    max-width: 95vw; 
    height: 100vh;
    background: var(--bw-bg);
    color: var(--bw-fg);
    border: none;
    overflow-y: auto; /* Scroll if font is too large */
    
    /* АНИМАЦИЯ: убираем display: none, используем visibility */
    transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease;
    will-change: transform, opacity;
    z-index: 2147483647;
  }

  bw-card * {
    box-sizing: border-box;
  }

  /* Slide from the left edge */
  .panel-hidden {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    transform: translate3d(-100%, 0, 0) !important;
    box-shadow: none !important;
  }

  .panel-visible ~ .trigger {
    transform: scale(0);
    opacity: 0;
    pointer-events: none;
  }

  /* Hide the trigger button gently when panel is open */
  .panel-visible ~ .trigger {
    transform: scale(0);
    opacity: 0;
    pointer-events: none;
  }

  bw-button {
    --bw-radius: var(--bw-radius);
    --bw-primary: var(--bw-primary);
  }

  .widget-container {
    display: block;
    pointer-events: none;
  }

  /* Header styling */
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: env(safe-area-inset-top, 0); /* Respect mobile notches */
  }

  .header-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.025em;
  }

  .close-btn {
    --bw-radius: 50%;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: var(--bw-bg-hover, #f4f4f5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .close-btn:hover { background: var(--bw-border, #e4e4e7); transform: rotate(90deg); }
  .close-btn svg { width: 18px; height: 18px; }

  /* Sections */
  .selector-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 1.5rem;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none; 
  }
  .selector-bar::-webkit-scrollbar {
    display: none;
  }

  .selector-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    padding: 10px 14px;
    background: var(--bw-bg-hover, #f8fafc);
    border: 1px solid var(--bw-border);
    border-radius: 9999px;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .selector-item:hover { background: var(--bw-border, #f1f5f9); }
  .selector-item svg { width: 16px; height: 16px; opacity: 0.7; }

  /* Grid */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
    margin-top: 1rem;
  }

  /* Grid 3-column for Color Tiles */
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 8px;
    margin-top: 1rem;
  }

  /* Color Custom Box */
  .color-custom-box {
    margin-top: 1.5rem;
    padding: 1rem;
    border: 1px solid var(--bw-border);
    border-radius: 1rem;
    background: var(--bw-bg);
  }

  .color-custom-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 1rem;
  }

  .color-custom-header svg {
    width: 24px;
    height: 24px;
    color: #3b82f6;
  }

  .color-custom-title {
    font-size: 0.9375rem;
    font-weight: 700;
    margin: 0;
  }

  .color-custom-subtitle {
    font-size: 0.8125rem;
    opacity: 0.6;
    margin: 0;
  }

  .color-tabs {
    display: flex;
    gap: 8px;
    margin: 1rem 0;
  }

  .color-tab {
    flex: 1;
    padding: 8px;
    font-size: 0.8125rem;
    font-weight: 600;
    text-align: center;
    background: #fff;
    border: 1px solid var(--bw-border);
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .color-tab[active] {
    background: #3b82f6;
    color: #fff;
    border-color: #3b82f6;
  }

  .hue-slider {
    -webkit-appearance: none;
    width: 100%;
    height: 12px;
    border-radius: 6px;
    background: linear-gradient(to right, 
      #ff0000 0%, #ffff00 17%, #00ff00 33%, 
      #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);
    outline: none;
    margin: 1rem 0;
  }

  .hue-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #3b82f6;
    border: 3px solid #fff;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }

  .reset-colors {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    font-size: 0.8125rem;
    color: #3b82f6;
    font-weight: 600;
    cursor: pointer;
    margin-top: 0.5rem;
  }

  .reset-colors:hover {
    text-decoration: underline;
  }

  /* Tiles active indicator */
  bw-button[vertical] {
    position: relative;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }

  .active-check {
    position: absolute;
    top: 6px;
    right: 6px;
    color: #3b82f6;
  }
  .active-check svg { width: 14px; height: 14px; }

  /* Section Titles */
  .section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--bw-primary);
    margin: 1.5rem 0 0.75rem 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* Footer */
  .footer-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    font-size: 0.75rem;
    opacity: 0.6;
    margin-bottom: env(safe-area-inset-bottom, 0);
    padding-top: 1rem;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 700;
    color: var(--bw-primary);
  }

  /* Responsive Adjustments for very narrow screens */
  @media (max-width: 480px) {
    bw-card {
      width: 100vw;
      max-width: 100vw;
      border-right: none;
    }
  }

  /* ========================= */
  /* CHAT TAB STYLES           */
  /* ========================= */

  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--bw-border);
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .tab {
    flex: 1;
    padding: 10px 8px;
    font-size: 0.875rem;
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    color: var(--bw-fg);
    opacity: 0.5;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .tab[active] {
    opacity: 1;
    border-bottom-color: var(--bw-primary);
    color: var(--bw-primary);
  }

  .tab-panel {
    display: none;
    flex: 1;
    min-height: 0;
    flex-direction: column;
    position: relative;
    height: 100%; /* Fill panel-body */
  }
  .tab-panel[active] {
    display: flex;
  }

  /* Chat messages area */
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .chat-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    opacity: 0.5;
    padding: 2rem;
    text-align: center;
  }
  .chat-empty svg { width: 40px; height: 40px; opacity: 0.4; }
  .chat-empty p { font-size: 0.875rem; margin: 0; }

  .chat-bubble {
    max-width: 85%;
    padding: 10px 14px;
    border-radius: 18px;
    font-size: 0.9rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .chat-bubble.user {
    align-self: flex-end;
    background: var(--bw-primary);
    color: var(--bw-primary-fg);
    border-bottom-right-radius: 4px;
  }

  .chat-bubble.assistant {
    align-self: flex-start;
    background: var(--bw-bg-hover, #f4f4f5);
    color: var(--bw-fg);
    border-bottom-left-radius: 4px;
    border: 1px solid var(--bw-border);
  }

  /* Typing indicator */
  .typing-indicator {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 12px 16px;
    background: var(--bw-bg-hover, #f4f4f5);
    border-radius: 18px;
    border-bottom-left-radius: 4px;
    border: 1px solid var(--bw-border);
    align-self: flex-start;
    width: fit-content;
  }

  .typing-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--bw-primary);
    opacity: 0.4;
    animation: bw-typing 1.4s infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bw-typing {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }

  /* Chat input bar */
  .chat-input-bar {
    display: flex;
    gap: 8px;
    padding: 1rem;
    border-top: 1px solid var(--bw-border);
    flex-shrink: 0;
    background: var(--bw-bg);
    margin-top: auto; /* Push to bottom of tab-panel */
    position: sticky;
    bottom: 0;
    z-index: 10;
  }

  .chat-input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--bw-border);
    border-radius: 9999px;
    font-size: 0.9rem;
    font-family: inherit;
    background: var(--bw-bg-hover, #f4f4f5);
    color: var(--bw-fg);
    outline: none;
    transition: border-color 0.2s;
  }
  .chat-input:focus { border-color: var(--bw-primary); }
  .chat-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .chat-send-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: var(--bw-primary);
    color: var(--bw-primary-fg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.2s, opacity 0.2s;
  }
  .chat-send-btn:hover:not(:disabled) { transform: scale(1.1); }
  .chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .chat-send-btn svg { width: 18px; height: 18px; }
`;
