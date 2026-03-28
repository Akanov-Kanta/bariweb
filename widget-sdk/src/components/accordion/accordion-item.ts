import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { accordionStyles } from './accordion.styles.js';
import { Icons } from '../../lib/icons.js';

@customElement('bw-accordion-item')
export class BWAccordionItem extends LitElement {
  static styles = [accordionStyles];

  @property({ type: String }) title = '';
  @property({ type: Boolean, reflect: true }) open = false;

  private _toggle() {
    this.open = !this.open;
    this.dispatchEvent(new CustomEvent('bw-toggle', {
      detail: { open: this.open },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="accordion-item" ?data-open=${this.open}>
        <button 
          class="trigger" 
          @click=${this._toggle} 
          aria-expanded=${this.open}
          aria-controls="content"
        >
          <span class="title">${this.title}</span>
          <span class="icon-wrapper">
            ${Icons.chevronDown || html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`}
          </span>
        </button>
        <div id="content" class="content-container" role="region">
          <div class="content">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}
