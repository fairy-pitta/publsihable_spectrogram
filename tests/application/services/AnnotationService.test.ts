import { describe, it, expect, beforeEach } from 'vitest';
import { AnnotationService } from '@application/services/AnnotationService';
import { Annotation, AnnotationType } from '@domain/entities/Annotation';

describe('AnnotationService', () => {
  let service: AnnotationService;

  beforeEach(() => {
    service = new AnnotationService();
  });

  it('should create service instance', () => {
    expect(service).toBeInstanceOf(AnnotationService);
  });

  it('should add annotation', () => {
    const annotation = new Annotation(
      AnnotationType.Text,
      { x: 100, y: 200 },
      { text: 'Test' }
    );

    service.addAnnotation(annotation);

    const annotations = service.getAnnotations();
    expect(annotations).toHaveLength(1);
    expect(annotations[0].id).toBe(annotation.id);
  });

  it('should remove annotation', () => {
    const annotation = new Annotation(
      AnnotationType.Text,
      { x: 100, y: 200 },
      { text: 'Test' }
    );

    service.addAnnotation(annotation);
    service.removeAnnotation(annotation.id);

    const annotations = service.getAnnotations();
    expect(annotations).toHaveLength(0);
  });

  it('should clear all annotations', () => {
    const annotation1 = new Annotation(AnnotationType.Text, { x: 0, y: 0 }, { text: 'A' });
    const annotation2 = new Annotation(AnnotationType.Text, { x: 0, y: 0 }, { text: 'B' });

    service.addAnnotation(annotation1);
    service.addAnnotation(annotation2);
    service.clearAnnotations();

    const annotations = service.getAnnotations();
    expect(annotations).toHaveLength(0);
  });

  it('should get annotation by id', () => {
    const annotation = new Annotation(
      AnnotationType.Text,
      { x: 100, y: 200 },
      { text: 'Test' }
    );

    service.addAnnotation(annotation);

    const found = service.getAnnotation(annotation.id);
    expect(found).toBe(annotation);
  });

  it('should update annotation', () => {
    const annotation = new Annotation(
      AnnotationType.Text,
      { x: 100, y: 200 },
      { text: 'Original' }
    );

    service.addAnnotation(annotation);

    annotation.position = { x: 200, y: 300 };
    annotation.properties.text = 'Updated';

    service.updateAnnotation(annotation);

    const updated = service.getAnnotation(annotation.id);
    expect(updated?.position.x).toBe(200);
    expect(updated?.position.y).toBe(300);
    expect(updated?.properties.text).toBe('Updated');
  });
});
