import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { cardStyles } from './card.styles.js';

@customElement('bw-card')
export class BWCard extends LitElement {
  static styles = [cardStyles];

  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'vertical';

  render() {
    const classes = {
      card: true,
      'card--vertical': this.orientation === 'vertical',
      'card--horizontal': this.orientation === 'horizontal'
    };

    return html`
      <article 
        part="base" 
        class="${classMap(classes)}"
        role="article"
      >
        <slot name="media" part="media"></slot>
        
        <div class="content-wrapper">
          <header class="header-slot" part="header">
            <slot name="header"></slot>
          </header>
          
          <main class="body-slot" part="body">
            <slot></slot>
          </main>
          
          <footer class="footer-slot" part="footer">
            <slot name="footer"></slot>
          </footer>
        </div>
      </article>
    `;
  }
}
