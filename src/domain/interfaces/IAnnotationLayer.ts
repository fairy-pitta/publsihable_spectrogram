import { Annotation } from '../entities/Annotation';

/**
 * Interface for annotation layer implementations
 * Provides abstraction for rendering annotations on different platforms (SVG, Canvas, etc.)
 */
export interface IAnnotationLayer {
  addAnnotation(annotation: Annotation): void;
  removeAnnotation(annotationId: string): void;
  clearAnnotations(): void;
  updateAnnotation(annotation: Annotation): void;
  getSVG(): SVGSVGElement | null;
  getSVGString(): string;
}

