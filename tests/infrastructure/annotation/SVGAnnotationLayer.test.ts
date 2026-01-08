import { describe, it, expect, beforeEach } from 'vitest';
import { SVGAnnotationLayer } from '@infrastructure/annotation/SVGAnnotationLayer';
import { Annotation, AnnotationType } from '@domain/entities/Annotation';

describe('SVGAnnotationLayer', () => {
  let annotationLayer: SVGAnnotationLayer;
  let svgElement: SVGSVGElement;

  beforeEach(() => {
    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('width', '800');
    svgElement.setAttribute('height', '600');
    document.body.appendChild(svgElement);

    annotationLayer = new SVGAnnotationLayer(svgElement);
  });

  it('should create SVGAnnotationLayer', () => {
    expect(annotationLayer).toBeInstanceOf(SVGAnnotationLayer);
  });

  it('should add text annotation', () => {
    const annotation = new Annotation(
      AnnotationType.Text,
      { x: 100, y: 200 },
      { text: 'Test Label' }
    );

    annotationLayer.addAnnotation(annotation);

    const textElement = svgElement.querySelector('text');
    expect(textElement).not.toBeNull();
    expect(textElement?.textContent).toBe('Test Label');
    expect(textElement?.getAttribute('x')).toBe('100');
    expect(textElement?.getAttribute('y')).toBe('200');
  });

  it('should add arrow annotation', () => {
    const annotation = new Annotation(
      AnnotationType.Arrow,
      { x: 50, y: 100 },
      { x2: 150, y2: 100 }
    );

    annotationLayer.addAnnotation(annotation);

    const lineElement = svgElement.querySelector('line');
    expect(lineElement).not.toBeNull();
    expect(lineElement?.getAttribute('x1')).toBe('50');
    expect(lineElement?.getAttribute('y1')).toBe('100');
    expect(lineElement?.getAttribute('x2')).toBe('150');
    expect(lineElement?.getAttribute('y2')).toBe('100');
  });

  it('should add rectangle annotation', () => {
    const annotation = new Annotation(
      AnnotationType.Rectangle,
      { x: 10, y: 20 },
      { width: 100, height: 50 }
    );

    annotationLayer.addAnnotation(annotation);

    const rectElement = svgElement.querySelector('rect');
    expect(rectElement).not.toBeNull();
    expect(rectElement?.getAttribute('x')).toBe('10');
    expect(rectElement?.getAttribute('y')).toBe('20');
    expect(rectElement?.getAttribute('width')).toBe('100');
    expect(rectElement?.getAttribute('height')).toBe('50');
  });

  it('should remove annotation', () => {
    const annotation = new Annotation(
      AnnotationType.Text,
      { x: 100, y: 200 },
      { text: 'Test' }
    );

    annotationLayer.addAnnotation(annotation);
    expect(svgElement.querySelector('text')).not.toBeNull();

    annotationLayer.removeAnnotation(annotation.id);
    expect(svgElement.querySelector('text')).toBeNull();
  });

  it('should clear all annotations', () => {
    const annotation1 = new Annotation(AnnotationType.Text, { x: 0, y: 0 }, { text: 'A' });
    const annotation2 = new Annotation(AnnotationType.Text, { x: 0, y: 0 }, { text: 'B' });

    annotationLayer.addAnnotation(annotation1);
    annotationLayer.addAnnotation(annotation2);

    expect(svgElement.querySelectorAll('text').length).toBe(2);

    annotationLayer.clearAnnotations();
    expect(svgElement.querySelectorAll('text').length).toBe(0);
  });

  it('should update annotation', () => {
    const annotation = new Annotation(
      AnnotationType.Text,
      { x: 100, y: 200 },
      { text: 'Original' }
    );

    annotationLayer.addAnnotation(annotation);
    annotation.position = { x: 200, y: 300 };
    annotation.properties.text = 'Updated';

    annotationLayer.updateAnnotation(annotation);

    const textElement = svgElement.querySelector('text');
    expect(textElement?.getAttribute('x')).toBe('200');
    expect(textElement?.getAttribute('y')).toBe('300');
    expect(textElement?.textContent).toBe('Updated');
  });
});
