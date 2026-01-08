import { Annotation } from '@domain/entities/Annotation';

type AnnotationChangeListener = () => void;

/**
 * Service for managing annotations with event-based change notifications
 */
export class AnnotationService {
  private annotations: Map<string, Annotation> = new Map();
  private listeners: Set<AnnotationChangeListener> = new Set();

  /**
   * Subscribe to annotation changes
   * @param listener Callback function called when annotations change
   * @returns Unsubscribe function
   */
  subscribe(listener: AnnotationChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  addAnnotation(annotation: Annotation): void {
    this.annotations.set(annotation.id, annotation);
    this.notifyListeners();
  }

  removeAnnotation(annotationId: string): void {
    this.annotations.delete(annotationId);
    this.notifyListeners();
  }

  clearAnnotations(): void {
    this.annotations.clear();
    this.notifyListeners();
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
      this.notifyListeners();
    }
  }
}
