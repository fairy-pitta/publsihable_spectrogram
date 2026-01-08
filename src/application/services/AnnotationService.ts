import { Annotation } from '@domain/entities/Annotation';

export class AnnotationService {
  private annotations: Map<string, Annotation> = new Map();

  addAnnotation(annotation: Annotation): void {
    this.annotations.set(annotation.id, annotation);
  }

  removeAnnotation(annotationId: string): void {
    this.annotations.delete(annotationId);
  }

  clearAnnotations(): void {
    this.annotations.clear();
  }

  getAnnotation(annotationId: string): Annotation | undefined {
    return this.annotations.get(annotationId);
  }

  getAnnotations(): Annotation[] {
    return Array.from(this.annotations.values());
  }

  updateAnnotation(annotation: Annotation): void {
    if (!annotation || !annotation.id) {
      return;
    }
    if (this.annotations.has(annotation.id)) {
      this.annotations.set(annotation.id, annotation);
    }
  }
}
