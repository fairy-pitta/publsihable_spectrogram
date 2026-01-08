import { Spectrogram } from '../entities/Spectrogram';
import { Annotation } from '../entities/Annotation';

export interface RenderOptions {
  colormap: 'viridis' | 'magma' | 'grayscale';
  brightness: number;
  contrast: number;
  gamma: number;
  showAxes: boolean;
  showColorbar: boolean;
  dbMin: number;
  dbMax: number;
  timeMin?: number; // Minimum time in seconds (optional)
  timeMax?: number; // Maximum time in seconds (optional)
  freqMin?: number; // Minimum frequency in Hz (optional)
  freqMax?: number; // Maximum frequency in Hz (optional)
}

export interface IRenderer {
  render(spectrogram: Spectrogram, options: RenderOptions): void;
  addAnnotation(annotation: Annotation): void;
  removeAnnotation(annotationId: string): void;
  clearAnnotations(): void;
  getCanvas(): HTMLCanvasElement | null;
  exportToSVG(): string;
  exportToPNG(dpi?: number): Promise<Blob>;
}

