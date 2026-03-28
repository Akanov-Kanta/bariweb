import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { buttonStyles } from './button.styles.js';

@customElement('bw-button')
export class BWButton extends LitElement {
  static styles = [buttonStyles];

  @property({ type: Boolean, reflect: true }) circle = false;
  @property({ type: Boolean, reflect: true }) vertical = false;
  @property({ reflect: true }) variant: 'primary' | 'outline' = 'primary';

  render() {
    const classes = {
      button: true,
      'button--circle': this.circle,
      'button--vertical': this.vertical,
      [`button--${this.variant}`]: true
    };

    return html`
      <button 
        class="${classMap(classes)}"
        role="button"
        aria-pressed=${this.circle ? 'mixed' : 'false'}
      >
        <slot name="icon"></slot>
        <slot></slot>
      </button>
    `;
  }
}
