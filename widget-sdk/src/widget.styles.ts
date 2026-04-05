import { css } from 'lit';

export const widgetStyles = css`
  :host {
    display: block;
    pointer-events: none;
    user-select: none;

    --bw-primary: #6d28d9;
    --bw-primary-light: #7c3aed;
    --bw-primary-fg: #ffffff;
    --bw-bg: #ffffff;
    --bw-fg: #0f172a;
    --bw-fg-muted: #64748b;
    --bw-border: #e2e8f0;
    --bw-bg-hover: #f8fafc;
    --bw-bg-subtle: #f1f5f9;
    --bw-radius: 14px;
    --bw-radius-sm: 8px;
    --bw-shadow-panel: 0 20px 60px -10px rgba(0,0,0,0.18), 0 8px 24px -4px rgba(0,0,0,0.1);

    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 15px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  /* ─── Accessibility themes ─── */
  :host([data-contrast="high"]) { --bw-bg: #000; --bw-fg: #ff0; --bw-primary: #fff; --bw-border: #fff; --bw-bg-hover: #111; --bw-primary-fg: #000; }
  :host([data-contrast="light"]) { --bw-bg: #f8fafc; --bw-fg: #64748b; --bw-border: #e2e8f0; }
  :host([data-text-spacing]) { line-height: var(--bw-line-height) !important; letter-spacing: var(--bw-letter-spacing) !important; }
  :host([data-dyslexic]) { font-family: "Comic Sans MS", "Comic Neue", sans-serif !important; }
  :host([data-focus-visualizer]) *:focus-visible { outline: 4px solid #f59e0b !important; outline-offset: 2px !important; }
  :host([data-cursor-magnifier]) { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2'%3E%3Cpath d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z'/%3E%3C/svg%3E"), auto !important; }
  :host([data-no-animations]) *, :host([data-no-animations]) { transition: none !important; animation: none !important; }
  :host([data-link-highlight]) a { text-decoration: underline !important; background-color: #fef08a !important; color: #000 !important; padding: 0 2px !important; border-radius: 2px !important; }

  /* ─── Widget container ─── */
  .widget-container {
    display: block;
    pointer-events: none;
  }

  /* ─── FAB Trigger ─── */
  .trigger {
    position: fixed;
    bottom: 24px;
    left: 24px;
    width: 60px;
    height: 60px;
    pointer-events: auto;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
    z-index: 2147483646;
  }
  .trigger:hover { transform: scale(1.08); }

  /* ─── Main Panel ─── */
  .bw-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 360px;
    max-width: 100vw;
    height: 100dvh;
    height: 100vh;
    background: var(--bw-bg);
    border-right: 1px solid var(--bw-border);
    box-shadow: var(--bw-shadow-panel);
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    z-index: 2147483647;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
    will-change: transform, opacity;
    overflow: hidden;
  }

  .bw-panel.panel-hidden {
    transform: translateX(-100%);
    opacity: 0;
    pointer-events: none;
  }

  .bw-panel.panel-visible ~ .trigger {
    transform: scale(0);
    opacity: 0;
    pointer-events: none;
  }

  /* ─── Header ─── */
  .bw-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--bw-border);
    flex-shrink: 0;
    background: var(--bw-bg);
  }

  .header-branding {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    padding: 4px;
    border-radius: var(--bw-radius-sm);
    transition: background 0.15s;
  }
  .header-branding:active { background: var(--bw-bg-hover); }
  .header-branding svg { width: 22px; height: 22px; color: var(--bw-primary); }
  .header-branding-text { display: flex; flex-direction: column; }
  .header-brand-name { font-size: 16px; font-weight: 800; letter-spacing: -0.02em; color: var(--bw-fg); line-height: 1.1; }
  .header-brand-sub { font-size: 11px; color: var(--bw-fg-muted); line-height: 1; }

  .close-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: var(--bw-bg-hover);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
    color: var(--bw-fg-muted);
  }
  .close-btn:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }
  .close-btn svg { width: 18px; height: 18px; }

  /* ─── Segmented Tab Control ─── */
  .bw-tabs {
    display: flex;
    padding: 12px 16px;
    gap: 6px;
    flex-shrink: 0;
    background: var(--bw-bg);
    border-bottom: 1px solid var(--bw-border);
  }

  .bw-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 8px;
    border: none;
    border-radius: var(--bw-radius-sm);
    background: var(--bw-bg-subtle);
    color: var(--bw-fg-muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 40px;
    white-space: nowrap;
  }
  .bw-tab:hover { background: var(--bw-bg-hover); color: var(--bw-fg); }
  .bw-tab[active] {
    background: var(--bw-primary);
    color: white;
    box-shadow: 0 2px 8px rgba(109, 40, 217, 0.3);
  }

  /* ─── Content area ─── */
  .bw-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .tab-panel {
    display: none;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .tab-panel[active] { display: flex; }

  /* ─── Footer ─── */
  .bw-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    border-top: 1px solid var(--bw-border);
    flex-shrink: 0;
    background: var(--bw-bg);
  }
  .footer-brand {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    color: var(--bw-primary);
    cursor: pointer;
    user-select: none;
  }
  .footer-brand svg { width: 14px; height: 14px; }
  .bw-footer span { font-size: 11px; color: var(--bw-fg-muted); }

  /* ════════════════════════════════ */
  /* CHAT TAB                         */
  /* ════════════════════════════════ */

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    scroll-behavior: smooth;
    overscroll-behavior-y: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--bw-border) transparent;
  }
  .chat-messages::-webkit-scrollbar { width: 4px; }
  .chat-messages::-webkit-scrollbar-thumb { background: var(--bw-border); border-radius: 4px; }

  .chat-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 2rem;
    text-align: center;
    color: var(--bw-fg-muted);
  }
  .chat-empty svg { width: 44px; height: 44px; opacity: 0.35; }
  .chat-empty-title { font-size: 15px; font-weight: 600; color: var(--bw-fg); margin: 0; }
  .chat-empty-sub { font-size: 13px; color: var(--bw-fg-muted); margin: 0; line-height: 1.5; }

  .chat-bubble {
    max-width: 82%;
    padding: 10px 14px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    animation: bubblePop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes bubblePop { from { opacity: 0; transform: scale(0.9) translateY(4px); } to { opacity: 1; transform: none; } }

  .chat-bubble.user {
    align-self: flex-end;
    background: var(--bw-primary);
    color: white;
    border-bottom-right-radius: 4px;
  }
  .chat-bubble.assistant {
    align-self: flex-start;
    background: var(--bw-bg-subtle);
    color: var(--bw-fg);
    border-bottom-left-radius: 4px;
    border: 1px solid var(--bw-border);
  }

  .screen-label-badge {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: var(--bw-radius-sm);
    padding: 6px 12px;
    font-size: 12px;
    color: #059669;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .screen-label-badge svg { width: 12px; height: 12px; flex-shrink: 0; }

  /* System log details */
  .system-log {
    background: var(--bw-bg-subtle);
    border: 1px solid var(--bw-border);
    border-radius: var(--bw-radius-sm);
    font-size: 12px;
    color: var(--bw-fg-muted);
    overflow: hidden;
  }
  .system-log-header {
    padding: 8px 12px;
    cursor: pointer;
    user-select: none;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .system-log-header::-webkit-details-marker { display: none; }
  .system-log-details { padding: 8px 12px; border-top: 1px solid var(--bw-border); white-space: pre-wrap; word-break: break-all; }

  /* Typing indicator */
  .typing-indicator {
    display: flex;
    align-self: flex-start;
    gap: 4px;
    padding: 12px 16px;
    background: var(--bw-bg-subtle);
    border: 1px solid var(--bw-border);
    border-radius: 18px;
    border-bottom-left-radius: 4px;
  }
  .typing-dot {
    width: 7px;
    height: 7px;
    background: var(--bw-fg-muted);
    border-radius: 50%;
    animation: typingBounce 1.2s infinite ease-in-out;
  }
  .typing-dot:nth-child(1) { animation-delay: 0s; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-5px); opacity: 1; } }

  /* Confirm panel */
  .confirm-panel {
    padding: 14px 16px;
    border-top: 1px solid var(--bw-border);
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
    background: var(--bw-bg);
  }
  .btn-confirm {
    width: 100%; min-height: 46px; border-radius: var(--bw-radius-sm);
    background: var(--bw-primary); color: white; border: none;
    font-weight: 700; font-size: 14px; cursor: pointer;
    transition: all 0.2s; box-shadow: 0 4px 12px rgba(109, 40, 217, 0.25);
  }
  .btn-confirm:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .btn-cancel {
    width: 100%; min-height: 44px; border-radius: var(--bw-radius-sm);
    background: transparent; color: #ef4444; border: 1px solid #fecaca;
    font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s;
  }
  .btn-cancel:hover { background: #fef2f2; }

  /* Chat input area */
  .chat-input-area {
    border-top: 1px solid var(--bw-border);
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    flex-shrink: 0;
    background: var(--bw-bg);
  }

  .stt-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: var(--bw-radius-sm);
  }
  .stt-banner.recording { color: #dc2626; background: rgba(220,38,38,0.08); }
  .stt-banner.processing { color: #2563eb; background: rgba(37,99,235,0.08); }
  .stt-banner.error { color: #dc2626; background: rgba(220,38,38,0.06); }

  .chat-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .chat-input {
    flex: 1;
    min-width: 0;
    height: 38px;
    padding: 0 14px;
    border: 1px solid var(--bw-border);
    border-radius: 999px;
    font-size: 14px;
    font-family: inherit;
    background: var(--bw-bg-subtle);
    color: var(--bw-fg);
    outline: none;
    transition: border-color 0.2s;
  }
  .chat-input:focus { border-color: var(--bw-primary); background: var(--bw-bg); }
  .chat-input:disabled { opacity: 0.5; cursor: not-allowed; }
  .chat-input::placeholder { color: var(--bw-fg-muted); }

  .chat-icon-btn {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid var(--bw-border);
    background: var(--bw-bg-subtle);
    color: var(--bw-fg-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s;
    font-size: 16px;
    line-height: 1;
  }
  .chat-icon-btn:hover:not(:disabled) { border-color: var(--bw-primary); color: var(--bw-primary); background: var(--bw-bg-hover); }
  .chat-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .chat-icon-btn svg { width: 17px; height: 17px; }

  /* Specialized Mic Button (Accessibility Target) */
  #bw-voice-btn {
    width: 56px;
    height: 56px;
    background: var(--bw-bg-subtle);
    border: 2px solid var(--bw-primary);
    color: var(--bw-primary);
    margin-right: 12px; /* Physical buffer from send button */
  }
  #bw-voice-btn:hover { background: rgba(109, 40, 217, 0.08); transform: scale(1.05); }
  #bw-voice-btn.recording {
    background: #fef2f2;
    border-color: #dc2626;
    color: #dc2626;
    animation: micPulse 1.5s infinite;
  }
  @keyframes micPulse {
    0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); transform: scale(1.05); }
    100% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); transform: scale(1.05); }
  }

  .chat-icon-btn.tts-on { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.4); color: #059669; }

  .chat-send-btn {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: var(--bw-primary);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(109,40,217,0.3);
    margin-left: 6px;
  }
  .chat-send-btn:hover:not(:disabled) { transform: scale(1.08); filter: brightness(1.1); }
  .chat-send-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
  .chat-send-btn svg { width: 18px; height: 18px; }

  /* ════════════════════════════════ */
  /* SETTINGS (A11Y) TAB             */
  /* ════════════════════════════════ */

  .a11y-scroller {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--bw-border) transparent;
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 0;
  }
  .a11y-scroller::-webkit-scrollbar { width: 4px; }
  .a11y-scroller::-webkit-scrollbar-thumb { background: var(--bw-border); border-radius: 4px; }

  /* Settings grid */
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 14px 14px 0;
  }

  .settings-card {
    background: var(--bw-bg-subtle);
    border: 1.5px solid var(--bw-border);
    border-radius: var(--bw-radius);
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
    position: relative;
    text-align: center;
    min-height: 90px;
    user-select: none;
    overflow: hidden;
  }
  .settings-card:hover { border-color: var(--bw-primary); background: var(--bw-bg); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.07); }
  .settings-card[active] {
    border-color: var(--bw-primary);
    background: rgba(109, 40, 217, 0.06);
    box-shadow: 0 0 0 1px var(--bw-primary);
  }
  .settings-card[active] svg { color: var(--bw-primary); }
  .settings-card svg { width: 22px; height: 22px; color: var(--bw-fg-muted); transition: color 0.18s; }
  .settings-card-label { font-size: 12px; font-weight: 600; color: var(--bw-fg); }
  .settings-card[active] .settings-card-label { color: var(--bw-primary); }
  .settings-card-value { font-size: 11px; color: var(--bw-fg-muted); font-weight: 500; }
  
  .active-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 18px;
    height: 18px;
    background: var(--bw-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .active-badge svg { width: 10px; height: 10px; color: white; stroke-width: 3; }

  /* Color section */
  .color-section {
    margin: 12px 14px 0;
    padding: 14px;
    border: 1.5px solid var(--bw-border);
    border-radius: var(--bw-radius);
    background: var(--bw-bg-subtle);
  }

  .color-section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .color-section-header svg { width: 16px; height: 16px; color: var(--bw-primary); }
  .color-section-title { font-size: 13px; font-weight: 700; color: var(--bw-fg); margin: 0; }

  .color-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }
  .color-tab {
    flex: 1;
    border: 1px solid var(--bw-border);
    border-radius: 6px;
    padding: 6px 4px;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    background: var(--bw-bg);
    color: var(--bw-fg-muted);
    transition: all 0.15s;
  }
  .color-tab[active] { background: var(--bw-primary); color: white; border-color: var(--bw-primary); }

  .hue-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .hue-step-btn {
    width: 32px; height: 32px; border: 1px solid var(--bw-border);
    border-radius: 50%; background: var(--bw-bg); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700; color: var(--bw-fg); flex-shrink: 0;
    transition: all 0.15s;
  }
  .hue-step-btn:hover { border-color: var(--bw-primary); color: var(--bw-primary); }
  .hue-slider {
    flex: 1; height: 8px; border-radius: 4px; -webkit-appearance: none;
    background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red);
    cursor: pointer; outline: none; border: none;
  }
  .hue-slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 20px; height: 20px;
    background: white; border: 2.5px solid var(--bw-primary);
    border-radius: 50%; cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }

  /* AI Tools section */
  .ai-tools-section {
    margin: 12px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .trigger svg {
    width: 28px;
    height: 28px;
  }

  .ai-tool-btn {
    width: 100%;
    padding: 12px 16px;
    border-radius: var(--bw-radius-sm);
    border: 1.5px solid var(--bw-border);
    background: var(--bw-bg);
    color: var(--bw-fg);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.18s;
    text-align: left;
    min-height: 46px;
  }
  .ai-tool-btn:hover { border-color: var(--bw-primary); color: var(--bw-primary); background: rgba(109,40,217,0.04); }
  .ai-tool-btn.active { background: rgba(109,40,217,0.08); border-color: var(--bw-primary); color: var(--bw-primary); }
  .ai-tool-btn svg { width: 18px; height: 18px; flex-shrink: 0; }
  .ai-tool-btn-label { flex: 1; }
  .ai-tool-badge { font-size: 10px; background: var(--bw-primary); color: white; padding: 2px 7px; border-radius: 99px; font-weight: 700; }
  .ai-tool-badge.on { background: #059669; }

  /* ════════════════════════════════ */
  /* ADMIN PANEL                      */
  /* ════════════════════════════════ */
  .admin-overlay {
    position: absolute;
    inset: 0;
    background: var(--bw-bg);
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    text-align: center;
    animation: adminFadeIn 0.25s ease;
  }
  @keyframes adminFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

  .admin-overlay .admin-icon { font-size: 32px; margin-bottom: 12px; }
  .admin-overlay h4 { font-size: 17px; font-weight: 700; margin: 0 0 6px; color: var(--bw-fg); }
  .admin-overlay p { font-size: 13px; color: var(--bw-fg-muted); margin: 0 0 20px; }
  .admin-overlay input {
    width: 100%; padding: 12px 14px; border-radius: var(--bw-radius-sm);
    border: 1.5px solid var(--bw-border); background: var(--bw-bg-subtle);
    color: var(--bw-fg); font-size: 14px; outline: none; margin-bottom: 10px;
    transition: border-color 0.2s;
  }
  .admin-overlay input:focus { border-color: var(--bw-primary); }
  .admin-login-btn {
    width: 100%; padding: 12px; border-radius: var(--bw-radius-sm);
    background: var(--bw-primary); color: white; border: none;
    font-weight: 700; font-size: 14px; cursor: pointer; margin-bottom: 8px;
    transition: all 0.2s;
  }
  .admin-login-btn:hover { filter: brightness(1.1); }
  .admin-logout-btn {
    width: 100%; padding: 12px; border-radius: var(--bw-radius-sm);
    background: #fef2f2; color: #ef4444; border: 1px solid #fecaca;
    font-weight: 600; font-size: 14px; cursor: pointer; margin-bottom: 8px;
    transition: all 0.2s;
  }
  .admin-logout-btn:hover { background: #fee2e2; }
  .admin-close-btn {
    background: none; border: none; color: var(--bw-fg-muted);
    font-size: 13px; cursor: pointer; padding: 6px; text-decoration: underline;
    margin-top: 4px;
  }
  .auth-error { color: #ef4444; font-size: 12px; margin: 0 0 12px; }
  .admin-status { color: #059669; font-size: 14px; font-weight: 600; margin: 0 0 16px; }
`;
