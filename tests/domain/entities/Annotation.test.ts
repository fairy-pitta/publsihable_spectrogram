import { describe, it, expect } from 'vitest';
import { Annotation, AnnotationType } from '@domain/entities/Annotation';

describe('Annotation', () => {
  it('should create a text annotation', () => {
    const annotation = new Annotation(
      AnnotationType.Text,
      { x: 100, y: 200 },
      { text: 'Test Label' }
    );

    expect(annotation.type).toBe(AnnotationType.Text);
    expect(annotation.position).toEqual({ x: 100, y: 200 });
    expect(annotation.properties.text).toBe('Test Label');
  });

  it('should create an arrow annotation', () => {
    const annotation = new Annotation(
      AnnotationType.Arrow,
      { x: 50, y: 100 },
      { x2: 150, y2: 100 }
    );

    expect(annotation.type).toBe(AnnotationType.Arrow);
    expect(annotation.position).toEqual({ x: 50, y: 100 });
    expect(annotation.properties.x2).toBe(150);
    expect(annotation.properties.y2).toBe(100);
  });

  it('should create a rectangle annotation', () => {
    const annotation = new Annotation(
      AnnotationType.Rectangle,
      { x: 10, y: 20 },
      { width: 100, height: 50 }
    );

    expect(annotation.type).toBe(AnnotationType.Rectangle);
    expect(annotation.position).toEqual({ x: 10, y: 20 });
    expect(annotation.properties.width).toBe(100);
    expect(annotation.properties.height).toBe(50);
  });

  it('should generate unique id', () => {
    const annotation1 = new Annotation(AnnotationType.Text, { x: 0, y: 0 }, { text: 'A' });
    const annotation2 = new Annotation(AnnotationType.Text, { x: 0, y: 0 }, { text: 'B' });

    expect(annotation1.id).toBeTruthy();
    expect(annotation2.id).toBeTruthy();
    expect(annotation1.id).not.toBe(annotation2.id);
  });

  it('should allow updating position', () => {
    const annotation = new Annotation(AnnotationType.Text, { x: 10, y: 20 }, { text: 'Test' });
    annotation.position = { x: 30, y: 40 };

    expect(annotation.position).toEqual({ x: 30, y: 40 });
  });

  it('should allow updating properties', () => {
    const annotation = new Annotation(
      AnnotationType.Rectangle,
      { x: 0, y: 0 },
      { width: 100, height: 50 }
    );
    annotation.properties = { width: 200, height: 100 };

    expect(annotation.properties.width).toBe(200);
    expect(annotation.properties.height).toBe(100);
  });
});
