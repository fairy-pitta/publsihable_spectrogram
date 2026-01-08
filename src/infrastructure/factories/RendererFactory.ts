import { IRenderer } from '@domain/interfaces/IRenderer';
import { IAnnotationLayer } from '@domain/interfaces/IAnnotationLayer';
import { CanvasSpectrogramRenderer } from '../renderer/CanvasSpectrogramRenderer';
import { SVGAnnotationLayer } from '../annotation/SVGAnnotationLayer';

/**
 * Factory for creating renderer and annotation layer instances
 * This factory is in the Infrastructure layer and can create concrete implementations
 */
export class RendererFactory {
  /**
   * Creates a canvas-based spectrogram renderer
   * @param canvas - The HTML canvas element to render on
   * @returns IRenderer instance
   */
  static createRenderer(canvas: HTMLCanvasElement): IRenderer {
    return new CanvasSpectrogramRenderer(canvas);
  }

  /**
   * Creates an SVG-based annotation layer
   * @param svg - The SVG element to render annotations on
   * @returns IAnnotationLayer instance
   */
  static createAnnotationLayer(svg: SVGSVGElement): IAnnotationLayer {
    return new SVGAnnotationLayer(svg);
  }
}

