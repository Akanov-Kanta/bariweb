import { css } from 'lit';

export const cardStyles = css`
  :host {
    display: block;
    min-height: 0;
    --bw-card-bg: var(--bw-bg, #ffffff);
    --bw-card-fg: var(--bw-fg, #09090b);
    --bw-card-radius: var(--bw-radius, 1rem);
    --bw-card-border: var(--bw-border, #e4e4e7);
    --bw-card-shadow: var(--bw-shadow, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
    --bw-card-padding: var(--bw-padding, 1.5rem);
  }

  .card {
    display: flex;
    background-color: var(--bw-card-bg);
    color: var(--bw-card-fg);
    border-radius: var(--bw-card-radius);
    border: 1px solid var(--bw-card-border);
    box-shadow: var(--bw-card-shadow);
    overflow: hidden;
    height: inherit;
    max-height: inherit;
  }

  .card--vertical { 
    flex-direction: column; 
  }
  .card--horizontal { flex-direction: row; }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .header-slot, .footer-slot {
    display: block;
    padding: var(--bw-card-padding);
    flex-shrink: 0;
  }

  .body-slot {
    display: flex;
    flex-direction: column;
    padding: var(--bw-body-padding, var(--bw-card-padding));
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    overscroll-behavior-y: contain;
    
    /* Custom scrollbar for webkit */
    scrollbar-width: thin;
    scrollbar-color: var(--bw-border, #e2e8f0) transparent;
  }

  .body-slot::-webkit-scrollbar {
    width: 6px;
  }
  .body-slot::-webkit-scrollbar-track {
    background: transparent;
  }
  .body-slot::-webkit-scrollbar-thumb {
    background: var(--bw-border, #e2e8f0);
    border-radius: 10px;
  }
  .body-slot::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
  }

  .header-slot { padding-bottom: 0; }
  .footer-slot { padding-top: 0; }
  
  ::slotted([slot="media"]) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
