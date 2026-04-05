import { css } from 'lit';

export const accordionStyles = css`
  :host {
    display: block;
    width: 100%;
    --bw-accordion-border: var(--bw-border, #e2e8f0);
    --bw-accordion-radius: var(--bw-radius, 0.5rem);
    --bw-accordion-bg: var(--bw-bg, #ffffff);
    --bw-accordion-fg: var(--bw-fg, #0f172a);
    --bw-accordion-padding: 1rem;
    --bw-accordion-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .accordion-item {
    border-bottom: 1px solid var(--bw-accordion-border);
    background: var(--bw-accordion-bg);
  }

  .accordion-item:last-child {
    border-bottom: none;
  }

  .trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--bw-accordion-padding);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--bw-accordion-fg);
    transition: var(--bw-accordion-transition);
    text-align: left;
  }

  .trigger:hover {
    background-color: var(--bw-bg-hover, #f8fafc);
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    transition: transform 0.3s ease;
    color: var(--bw-accordion-fg);
  }

  .icon-wrapper svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
    flex-shrink: 0;
  }

  .trigger[aria-expanded="true"] .icon-wrapper {
    transform: rotate(180deg);
  }

  .content-container {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s ease, visibility 0.3s;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;
  }

  .trigger[aria-expanded="true"] + .content-container {
    grid-template-rows: 1fr;
    visibility: visible;
    pointer-events: auto;
  }

  .content {
    min-height: 0;
    padding: 0 var(--bw-accordion-padding) var(--bw-accordion-padding) var(--bw-accordion-padding);
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--bw-accordion-fg);
    opacity: 0.8;
  }
`;
