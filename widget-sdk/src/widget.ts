import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Icons } from './lib/icons.ts';
import { widgetStyles } from './widget.styles.ts';
import './components/button/button.js';
import './components/card/card.js';
import './components/accordion/accordion-item.js';

@customElement('bw-widget')
export class BariwebWidget extends LitElement {
  static styles = [widgetStyles];

  @state() private _isOpen = false;

  private _toggle() {
    this._isOpen = !this._isOpen;
  }

  render() {
    return html`
      <div class="widget-container">
        <bw-card 
          class="${this._isOpen ? 'panel-visible' : 'panel-hidden'}"
          role="dialog"
          aria-label="Accessibility Menu"
        >
          <div slot="header" class="header-content">
            <h2 class="header-title">BariWeb Инклюзия</h2>
            <button 
              class="close-btn" 
              @click=${this._toggle} 
              aria-label="Close menu"
            >
              ${Icons.close}
            </button>
          </div>

          <nav class="selector-bar" aria-label="Quick Settings">
            <div class="selector-item" role="button" tabindex="0">${Icons.languages} Русский</div>
            <div class="selector-item" role="button" tabindex="0">${Icons.profiles} Профили</div>
          </nav>

          <bw-accordion-item title="Основные функции" open>
            <div class="grid">
              <bw-button vertical variant="outline">
                <span slot="icon">${Icons.textSize}</span>
                Размер текста
              </bw-button>
              <bw-button vertical variant="outline">
                <span slot="icon">${Icons.contrast}</span>
                Контрастность
              </bw-button>
              <bw-button vertical variant="outline">
                <span slot="icon">${Icons.grayscale}</span>
                ЧБ Режим
              </bw-button>
              <bw-button vertical variant="outline">
                <span slot="icon">${Icons.cursor}</span>
                Курсор
              </bw-button>
              <bw-button vertical variant="outline">
                <span slot="icon">${Icons.screenReader}</span>
                Чтение вслух
              </bw-button>
              <bw-button vertical variant="outline">
                <span slot="icon">${Icons.visualImpair}</span>
                Скрытые ссылки
              </bw-button>
            </div>
          </bw-accordion-item>

          <bw-accordion-item title="Профили доступности">
            <div class="grid">
              <bw-button variant="outline" style="grid-column: span 2; justify-content: flex-start; text-align: left; padding: 1rem;">
                <span slot="icon">${Icons.seizureSafe}</span>
                Безопасно для приступов
              </bw-button>
              <bw-button variant="outline" style="grid-column: span 2; justify-content: flex-start; text-align: left; padding: 1rem;">
                <span slot="icon">${Icons.cognitive}</span>
                Когнитивная помощь
              </bw-button>
            </div>
          </bw-accordion-item>

          <bw-accordion-item title="Как это работает?">
            <p>Этот виджет помогает адаптировать сайт под ваши нужды (увеличение текста, смена контрастности и др.).</p>
          </bw-accordion-item>
          
          <bw-accordion-item title="О нас">
            <p>BariWeb — лидер в области инклюзивных технологий в Казахстане.</p>
          </bw-accordion-item>


          <div slot="footer" class="footer-content">
            <div class="footer-brand">
              ${Icons.accessibility} BariWeb
            </div>
            <span>Сделано в Казахстане 🇰🇿</span>
          </div>
        </bw-card>

        <bw-button 
          circle 
          variant="primary" 
          @click=${this._toggle}
          class="trigger"
          aria-expanded=${this._isOpen}
          aria-label="Toggle accessibility menu"
        >
          ${this._isOpen ? Icons.close : Icons.accessibility}
        </bw-button>
      </div>
    `;
  }
}
