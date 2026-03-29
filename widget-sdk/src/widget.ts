import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Icons } from './lib/icons.ts';
import { widgetStyles } from './widget.styles.ts';
import { ApiRequestError, transcribeAudio } from './controllers/ai.controller.ts';
import { ocrFromImageUrl } from './controllers/scanner.controller.ts';
import './components/button/button.js';
import './components/card/card.js';
import './components/accordion/accordion-item.js';

type AiStatus = 'idle' | 'loading' | 'success' | 'error';

@customElement('bw-widget')
export class BariwebWidget extends LitElement {
  static styles = [widgetStyles];

  @state() private _isOpen = false;
  @state() private _aiStatus: AiStatus = 'idle';
  @state() private _aiResult = 'No AI requests yet.';
  @state() private _lastRequestId = '';

  private _toggle() {
    this._isOpen = !this._isOpen;
  }

  private async _handleVoiceCommand() {
    try {
      this._aiStatus = 'loading';
      this._lastRequestId = '';
      this._aiResult = 'Recording audio for 5 seconds...';

      const audioBlob = await this._captureAudio(5_000);
      this._aiResult = 'Sending audio to STT...';

      const response = await transcribeAudio(audioBlob, 'auto');

      this._aiStatus = 'success';
      this._lastRequestId = response.requestId;
      this._aiResult = `${response.text}\n(${response.provider}, ${response.latencyMs}ms${response.cacheHit ? ', cache hit' : ''})`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Voice command failed.';
      this._aiStatus = 'error';
      this._aiResult = message;
      this._lastRequestId = error instanceof ApiRequestError && error.requestId ? error.requestId : '';
    }
  }

  private async _handleOcrByUrl() {
    const imageUrl = window.prompt('Paste image URL for OCR');
    if (!imageUrl) {
      return;
    }

    try {
      this._aiStatus = 'loading';
      this._lastRequestId = '';
      this._aiResult = 'Sending image URL to OCR...';

      const response = await ocrFromImageUrl(
        imageUrl,
        'Extract only text that is visibly present in the image. Preserve original language/script exactly, do not translate. Do not repeat this instruction. If no readable text exists, return NO_TEXT.'
      );
      

      this._aiStatus = 'success';
      this._lastRequestId = response.requestId;
      this._aiResult = `${response.text}\n(${response.provider}, ${response.latencyMs}ms${response.cacheHit ? ', cache hit' : ''})`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OCR request failed.';
      this._aiStatus = 'error';
      this._aiResult = message;
      this._lastRequestId = error instanceof ApiRequestError && error.requestId ? error.requestId : '';
    }
  }

  private async _captureAudio(durationMs: number): Promise<Blob> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Your browser does not support microphone capture.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    try {
      const mimeTypeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      const mimeType = mimeTypeCandidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      const chunks: BlobPart[] = [];

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      });

      const stopped = new Promise<Blob>((resolve, reject) => {
        recorder.addEventListener('stop', () => {
          if (chunks.length === 0) {
            reject(new Error('No audio captured.'));
            return;
          }

          resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
        });

        recorder.addEventListener('error', () => {
          reject(new Error('Audio recorder failed.'));
        });
      });

      recorder.start();
      await new Promise((resolve) => setTimeout(resolve, durationMs));
      recorder.stop();

      const recordedBlob = await stopped;
      return await this._toWav(recordedBlob);
    } finally {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  private async _toWav(inputBlob: Blob): Promise<Blob> {
    if (inputBlob.type.includes('wav')) {
      return inputBlob;
    }

    const arrayBuffer = await inputBlob.arrayBuffer();
    const audioContext = new AudioContext();

    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      return this._encodeWav(audioBuffer);
    } catch {
      // Fallback to original blob if decoding is not supported in current browser.
      return inputBlob;
    } finally {
      await audioContext.close();
    }
  }

  private _encodeWav(audioBuffer: AudioBuffer): Blob {
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bytesPerSample = 2;
    const blockAlign = channels * bytesPerSample;
    const totalFrames = audioBuffer.length;
    const dataSize = totalFrames * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    let offset = 0;
    const writeString = (value: string) => {
      for (let i = 0; i < value.length; i += 1) {
        view.setUint8(offset, value.charCodeAt(i));
        offset += 1;
      }
    };

    writeString('RIFF');
    view.setUint32(offset, 36 + dataSize, true);
    offset += 4;
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true);
    offset += 2;
    view.setUint16(offset, channels, true);
    offset += 2;
    view.setUint32(offset, sampleRate, true);
    offset += 4;
    view.setUint32(offset, sampleRate * blockAlign, true);
    offset += 4;
    view.setUint16(offset, blockAlign, true);
    offset += 2;
    view.setUint16(offset, bytesPerSample * 8, true);
    offset += 2;
    writeString('data');
    view.setUint32(offset, dataSize, true);
    offset += 4;

    const channelData = Array.from({ length: channels }, (_, index) => audioBuffer.getChannelData(index));
    for (let frame = 0; frame < totalFrames; frame += 1) {
      for (let channel = 0; channel < channels; channel += 1) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][frame]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  render() {
    const isBusy = this._aiStatus === 'loading';

    return html`
      <div class="widget-container">
        <bw-card
          class="${this._isOpen ? 'panel-visible' : 'panel-hidden'}"
          role="dialog"
          aria-label="Accessibility Menu"
        >
          <div slot="header" class="header-content">
            <h2 class="header-title">BariWeb Inclusion</h2>
            <button
              class="close-btn"
              @click=${this._toggle}
              aria-label="Close menu"
            >
              ${Icons.close}
            </button>
          </div>

          <nav class="selector-bar" aria-label="Quick Settings">
            <div class="selector-item" role="button" tabindex="0">${Icons.languages} Language</div>
            <div class="selector-item" role="button" tabindex="0">${Icons.profiles} Profiles</div>
          </nav>

          <bw-accordion-item title="Core features" open>
            <div class="grid">
              <bw-button vertical variant="outline">
                <span slot="icon">${Icons.textSize}</span>
                Text size
              </bw-button>
              <bw-button vertical variant="outline">
                <span slot="icon">${Icons.contrast}</span>
                Contrast
              </bw-button>
              <bw-button vertical variant="outline">
                <span slot="icon">${Icons.grayscale}</span>
                Grayscale
              </bw-button>
              <bw-button vertical variant="outline">
                <span slot="icon">${Icons.cursor}</span>
                Cursor
              </bw-button>
              <bw-button vertical variant="outline">
                <span slot="icon">${Icons.screenReader}</span>
                Read aloud
              </bw-button>
              <bw-button vertical variant="outline">
                <span slot="icon">${Icons.visualImpair}</span>
                Hidden links
              </bw-button>
            </div>
          </bw-accordion-item>

          <bw-accordion-item title="Accessibility profiles">
            <div class="grid">
              <bw-button variant="outline" style="grid-column: span 2; justify-content: flex-start; text-align: left; padding: 1rem;">
                <span slot="icon">${Icons.seizureSafe}</span>
                Seizure-safe profile
              </bw-button>
              <bw-button variant="outline" style="grid-column: span 2; justify-content: flex-start; text-align: left; padding: 1rem;">
                <span slot="icon">${Icons.cognitive}</span>
                Cognitive support
              </bw-button>
            </div>
          </bw-accordion-item>

          <bw-accordion-item title="AI Beta: Voice + OCR">
            <div class="ai-beta-actions">
              <button class="ai-beta-btn" @click=${this._handleVoiceCommand} ?disabled=${isBusy}>
                Voice command (5s)
              </button>
              <button class="ai-beta-btn" @click=${this._handleOcrByUrl} ?disabled=${isBusy}>
                OCR by image URL
              </button>
            </div>

            <div class="ai-status ai-status--${this._aiStatus}" role="status" aria-live="polite">
              <strong>Status:</strong> ${this._aiStatus}
            </div>

            <pre class="ai-result">${this._aiResult}</pre>
            ${this._lastRequestId
              ? html`<p class="ai-request-id">Request ID: <code>${this._lastRequestId}</code></p>`
              : null}
          </bw-accordion-item>

          <bw-accordion-item title="How it works">
            <p>
              This widget helps users adapt website visuals and navigation to their accessibility needs.
            </p>
          </bw-accordion-item>

          <bw-accordion-item title="About">
            <p>BariWeb builds inclusive web technology in Kazakhstan.</p>
          </bw-accordion-item>

          <div slot="footer" class="footer-content">
            <div class="footer-brand">
              ${Icons.accessibility} BariWeb
            </div>
            <span>Made in Kazakhstan</span>
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
