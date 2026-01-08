import { Annotation, AnnotationType } from '@domain/entities/Annotation';

export class SVGAnnotationLayer {
  private svg: SVGSVGElement;
  private annotationElements: Map<string, SVGElement> = new Map();

  constructor(svg: SVGSVGElement) {
    this.svg = svg;
  }

  addAnnotation(annotation: Annotation): void {
    if (this.annotationElements.has(annotation.id)) {
      this.updateAnnotation(annotation);
      return;
    }

    const element = this.createAnnotationElement(annotation);
    if (element) {
      this.svg.appendChild(element);
      this.annotationElements.set(annotation.id, element);
    }
  }

  removeAnnotation(annotationId: string): void {
    const element = this.annotationElements.get(annotationId);
    if (element) {
      this.svg.removeChild(element);
      this.annotationElements.delete(annotationId);
    }
  }

  clearAnnotations(): void {
    this.annotationElements.forEach((element) => {
      this.svg.removeChild(element);
    });
    this.annotationElements.clear();
  }

  updateAnnotation(annotation: Annotation): void {
    const element = this.annotationElements.get(annotation.id);
    if (!element) {
      this.addAnnotation(annotation);
      return;
    }

    this.removeAnnotation(annotation.id);
    this.addAnnotation(annotation);
  }

  private createAnnotationElement(annotation: Annotation): SVGElement | null {
    switch (annotation.type) {
      case AnnotationType.Text:
        return this.createTextElement(annotation);
      case AnnotationType.Arrow:
        return this.createArrowElement(annotation);
      case AnnotationType.Rectangle:
        return this.createRectangleElement(annotation);
      default:
        return null;
    }
  }

  private createTextElement(annotation: Annotation): SVGTextElement {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', annotation.position.x.toString());
    text.setAttribute('y', annotation.position.y.toString());
    text.setAttribute('font-family', (annotation.properties.fontFamily as string) || 'Arial');
    text.setAttribute('font-size', (annotation.properties.fontSize as string) || '14px');
    text.setAttribute('fill', (annotation.properties.color as string) || '#000000');
    text.textContent = (annotation.properties.text as string) || '';

    if (annotation.id) {
      text.setAttribute('data-annotation-id', annotation.id);
    }

    return text;
  }

  private createArrowElement(annotation: Annotation): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('data-annotation-id', annotation.id);

    const x1 = annotation.position.x;
    const y1 = annotation.position.y;
    const x2 = annotation.properties.x2 as number;
    const y2 = annotation.properties.y2 as number;

    if (x2 === undefined || y2 === undefined) {
      return group;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const arrowLength = (annotation.properties.arrowLength as number) || 10;
    const arrowAngle = Math.PI / 6;

    // Draw line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1.toString());
    line.setAttribute('y1', y1.toString());
    line.setAttribute('x2', x2.toString());
    line.setAttribute('y2', y2.toString());
    line.setAttribute('stroke', (annotation.properties.color as string) || '#000000');
    line.setAttribute('stroke-width', ((annotation.properties.width as number) || 2).toString());
    group.appendChild(line);

    // Draw arrowhead
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const arrowX1 = x2 - arrowLength * Math.cos(angle - arrowAngle);
    const arrowY1 = y2 - arrowLength * Math.sin(angle - arrowAngle);
    const arrowX2 = x2 - arrowLength * Math.cos(angle + arrowAngle);
    const arrowY2 = y2 - arrowLength * Math.sin(angle + arrowAngle);

    const pathData = `M ${x2} ${y2} L ${arrowX1} ${arrowY1} M ${x2} ${y2} L ${arrowX2} ${arrowY2}`;
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', (annotation.properties.color as string) || '#000000');
    path.setAttribute('stroke-width', ((annotation.properties.width as number) || 2).toString());
    path.setAttribute('fill', 'none');
    group.appendChild(path);

    return group;
  }

  private createRectangleElement(annotation: Annotation): SVGRectElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', annotation.position.x.toString());
    rect.setAttribute('y', annotation.position.y.toString());
    rect.setAttribute('width', ((annotation.properties.width as number) || 100).toString());
    rect.setAttribute('height', ((annotation.properties.height as number) || 50).toString());
    rect.setAttribute('stroke', (annotation.properties.color as string) || '#000000');
    rect.setAttribute('stroke-width', ((annotation.properties.lineWidth as number) || 2).toString());

    const fillColor = annotation.properties.fillColor as string;
    if (fillColor && fillColor !== 'transparent') {
      rect.setAttribute('fill', fillColor);
      rect.setAttribute('fill-opacity', ((annotation.properties.fillOpacity as number) || 0.2).toString());
    } else {
      rect.setAttribute('fill', 'none');
    }

    if (annotation.id) {
      rect.setAttribute('data-annotation-id', annotation.id);
    }

    return rect;
  }

  getSVG(): SVGSVGElement {
    return this.svg;
  }

  getSVGString(): string {
    return new XMLSerializer().serializeToString(this.svg);
  }
}
