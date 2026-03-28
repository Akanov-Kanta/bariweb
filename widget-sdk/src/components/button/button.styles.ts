import { css } from 'lit';

export const buttonStyles = css`
  :host {
    display: inline-block;
    width: 100%;
    
    --bw-button-radius: var(--bw-radius, 0.5rem);
    --bw-button-font-family: inherit;
    --bw-button-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    --bw-button-bg: var(--bw-bg, #ffffff);
    --bw-button-fg: var(--bw-fg, #18181b);
    --bw-button-border: var(--bw-border, #e4e4e7);
    
    --bw-button-primary-bg: var(--bw-primary, #18181b);
    --bw-button-primary-fg: var(--bw-primary-fg, #ffffff);
    
    --bw-button-shadow: var(--bw-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    --bw-button-hover-shadow: var(--bw-shadow-md, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1));
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1.25rem;
    border: 1px solid var(--bw-button-border);
    border-radius: var(--bw-button-radius);
    background: var(--bw-button-bg);
    color: var(--bw-button-fg);
    font-family: var(--bw-button-font-family);
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: var(--bw-button-transition);
    box-sizing: border-box;
    outline: none;
    box-shadow: var(--bw-button-shadow);
    position: relative;
    overflow: hidden;
  }

  .button:focus-visible {
    outline: 2px solid var(--bw-button-primary-bg);
    outline-offset: 2px;
  }

  .button:hover {
    box-shadow: var(--bw-button-hover-shadow);
    transform: translateY(-2px);
  }

  .button:active {
    transform: translateY(0) scale(0.98);
  }

  /* Variants */
  .button--primary { 
    background: var(--bw-button-primary-bg); 
    color: var(--bw-button-primary-fg); 
    border-color: transparent;
  }
  .button--primary:hover {
    filter: brightness(1.2);
  }

  /* Vertical Tile Mode */
  .button--vertical {
    flex-direction: column;
    padding: 1.5rem 1rem;
    height: 100%;
    text-align: center;
    gap: 0.5rem;
  }

  .button--circle {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    padding: 0;
  }

  /* Icon slot styling */
  ::slotted(svg), ::slotted(.bw-icon) {
    width: var(--bw-button-icon-size, 1.5rem);
    height: var(--bw-button-icon-size, 1.5rem);
    flex-shrink: 0;
  }

  .button--vertical ::slotted(svg), .button--vertical ::slotted(.bw-icon) {
    width: 2rem;
    height: 2rem;
    margin-bottom: 0.25rem;
  }
`;
