import { css } from 'lit';

export const widgetStyles = css`
  :host {
    display: inline-block;
    /* Host provides the layout for the trigger button.
       Users can style <bw-widget> in their external CSS
       e.g., position: fixed; bottom: 20px; left: 20px; */
       
    --bw-primary: var(--bw-primary-color, #18181b);
    --bw-primary-fg: var(--bw-primary-fg-color, #ffffff);
    --bw-bg: var(--bw-bg-color, #ffffff);
    --bw-fg: var(--bw-fg-color, #09090b);
    --bw-border: var(--bw-border-color, #e4e4e7);
    --bw-radius: var(--bw-radius-size, 1rem);
    --bw-shadow: var(--bw-shadow-lg, 0 -10px 40px rgba(0, 0, 0, 0.12));
    
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* The trigger button fills the host element */
  .trigger {
    width: var(--bw-trigger-size, 64px);
    height: var(--bw-trigger-size, 64px);
    --bw-button-icon-size: calc(var(--bw-trigger-size, 64px) * 0.5); /* Adaptive icon size */
    pointer-events: auto;
    margin: 0;
    transition: transform 0.3s ease;
  }

  /* The sliding sidebar panel */
  bw-card {
    --bw-radius: 0; /* Flat edges for full height sidebar */
    --bw-bg: var(--bw-bg);
    --bw-fg: var(--bw-fg);
    --bw-border: var(--bw-border);
    --bw-shadow: var(--bw-shadow);
    
    position: fixed;
    top: 0;
    left: 0;
    width: 400px;
    max-width: 85vw; /* Respect small screens */
    height: 100vh;
    max-height: 100vh;
    margin: 0;
    border-top: none;
    border-bottom: none;
    border-left: none; /* Attached to left edge */
    border-right: 1px solid var(--bw-border);
    transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease;
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    z-index: 2147483647; /* Maximum safe z-index to overlay everything */
    box-shadow: 10px 0 30px rgba(0,0,0,0.1);
  }

  /* Slide from the left edge */
  .panel-hidden {
    opacity: 0;
    transform: translateX(-100%);
    pointer-events: none;
  }

  .panel-visible {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
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
    display: contents; /* Allows fixed bw-card and relative trigger to act independently */
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 1rem;
  }

  .ai-beta-actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    margin-top: 0.5rem;
  }

  .ai-beta-btn {
    border: 1px solid var(--bw-border);
    border-radius: 10px;
    background: var(--bw-bg);
    color: var(--bw-fg);
    font: inherit;
    font-weight: 600;
    padding: 0.75rem 0.9rem;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
    text-align: left;
  }

  .ai-beta-btn:hover {
    background: #f4f4f5;
    transform: translateY(-1px);
  }

  .ai-beta-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .ai-status {
    margin-top: 0.9rem;
    font-size: 0.875rem;
    padding: 0.65rem 0.75rem;
    border-radius: 10px;
    border: 1px solid var(--bw-border);
    background: #fafafa;
  }

  .ai-status--loading {
    background: #fef9c3;
    border-color: #facc15;
  }

  .ai-status--success {
    background: #dcfce7;
    border-color: #4ade80;
  }

  .ai-status--error {
    background: #fee2e2;
    border-color: #f87171;
  }

  .ai-result {
    margin-top: 0.75rem;
    margin-bottom: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    white-space: pre-wrap;
    word-break: break-word;
    background: #fafafa;
    border: 1px solid var(--bw-border);
    border-radius: 10px;
    padding: 0.65rem 0.75rem;
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .ai-request-id {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    opacity: 0.8;
    overflow-wrap: anywhere;
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
`;
