import { IRenderer, RenderOptions } from '@domain/interfaces/IRenderer';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { Annotation } from '@domain/entities/Annotation';

export class SpectrogramRenderService {
  constructor(private renderer: IRenderer) {}

  render(spectrogram: Spectrogram, options: RenderOptions): void {
    this.renderer.render(spectrogram, options);
  }

  addAnnotation(annotation: Annotation): void {
    this.renderer.addAnnotation(annotation);
  }

  removeAnnotation(annotationId: string): void {
    this.renderer.removeAnnotation(annotationId);
  }

  clearAnnotations(): void {
    this.renderer.clearAnnotations();
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.renderer.getCanvas();
  }
}
