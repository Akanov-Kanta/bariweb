import { css } from 'lit';

export const widgetStyles = css`
  :host {
    --bw-primary: var(--bw-primary-color, #18181b);
    --bw-primary-fg: var(--bw-primary-fg-color, #ffffff);
    --bw-bg: var(--bw-bg-color, #ffffff);
    --bw-fg: var(--bw-fg-color, #09090b);
    --bw-border: var(--bw-border-color, #e4e4e7);
    --bw-radius: var(--bw-radius-size, 1rem);
    --bw-shadow: var(--bw-shadow-lg, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04));

    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999; 
    font-family: system-ui, -apple-system, sans-serif;
  }

  bw-card {
    --bw-radius: var(--bw-radius);
    --bw-bg: var(--bw-bg);
    --bw-fg: var(--bw-fg);
    --bw-border: var(--bw-border);
    --bw-shadow: var(--bw-shadow);
    
    width: 400px;
    max-height: 80vh;
    min-height: 0;
    margin-bottom: 16px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: bottom right;
    display: flex;
    flex-direction: column;
  }

  bw-button {
    --bw-radius: var(--bw-radius);
    --bw-primary: var(--bw-primary);
  }

  .panel-hidden {
    opacity: 0;
    transform: scale(0.9) translateY(40px);
    pointer-events: none;
  }

  .panel-visible {
    opacity: 1;
    transform: scale(1) translateY(0);
    pointer-events: auto;
  }

  .widget-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  /* Header styling */
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
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
  }

  .selector-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bw-bg-hover, #f8fafc);
    border: 1px solid var(--bw-border);
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .selector-item:hover { background: var(--bw-border, #f1f5f9); }
  .selector-item svg { width: 16px; height: 16px; opacity: 0.7; }

  /* Grid */
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 1rem;
  }

  .grid-label {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    display: block;
    color: var(--bw-fg);
    opacity: 0.8;
  }

  /* Footer */
  .footer-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    font-size: 0.75rem;
    opacity: 0.6;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 700;
    color: var(--bw-primary);
  }

  .trigger {
    --bw-button-icon-size: 28px;
  }


`;
