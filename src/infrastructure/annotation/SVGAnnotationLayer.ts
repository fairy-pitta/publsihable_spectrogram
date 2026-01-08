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
    if (!annotation || !annotation.id) {
      return;
    }
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

  private createTextElement(annotation: Annotation): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('data-annotation-id', annotation.id);
    group.style.cursor = 'move';
    group.style.userSelect = 'none';

    // Create invisible background rectangle for easier dragging (expanded hit area)
    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const fontSize = parseInt((annotation.properties.fontSize as string) || '14px') || 14;
    const textContent = (annotation.properties.text as string) || '';
    // Estimate text width (rough approximation: 0.6 * fontSize per character)
    const estimatedWidth = textContent.length * fontSize * 0.6;
    const padding = 10; // Expand hit area by 10px on each side
    hitArea.setAttribute('x', (annotation.position.x - padding).toString());
    hitArea.setAttribute('y', (annotation.position.y - fontSize - padding).toString());
    hitArea.setAttribute('width', (estimatedWidth + padding * 2).toString());
    hitArea.setAttribute('height', (fontSize + padding * 2).toString());
    hitArea.setAttribute('fill', 'transparent');
    hitArea.style.pointerEvents = 'all';
    group.appendChild(hitArea);

    // Create the actual text element
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', annotation.position.x.toString());
    text.setAttribute('y', annotation.position.y.toString());
    text.setAttribute('font-family', (annotation.properties.fontFamily as string) || 'Arial');
    text.setAttribute('font-size', (annotation.properties.fontSize as string) || '14px');
    text.setAttribute('fill', (annotation.properties.color as string) || '#000000');
    text.textContent = textContent;
    text.style.pointerEvents = 'none'; // Let the hit area handle pointer events
    group.appendChild(text);

    return group;
  }

  private createArrowElement(annotation: Annotation): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('data-annotation-id', annotation.id);
    group.style.userSelect = 'none';

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
    const handleRadius = 6;

    // Draw line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1.toString());
    line.setAttribute('y1', y1.toString());
    line.setAttribute('x2', x2.toString());
    line.setAttribute('y2', y2.toString());
    line.setAttribute('stroke', (annotation.properties.color as string) || '#000000');
    line.setAttribute('stroke-width', ((annotation.properties.width as number) || 2).toString());
    line.style.cursor = 'move';
    line.style.pointerEvents = 'all';
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
    path.style.pointerEvents = 'none';
    group.appendChild(path);

    // Create draggable handle for start point (x1, y1)
    const startHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startHandle.setAttribute('cx', x1.toString());
    startHandle.setAttribute('cy', y1.toString());
    startHandle.setAttribute('r', handleRadius.toString());
    startHandle.setAttribute('fill', (annotation.properties.color as string) || '#000000');
    startHandle.setAttribute('stroke', '#ffffff');
    startHandle.setAttribute('stroke-width', '2');
    startHandle.setAttribute('data-arrow-end', 'start');
    startHandle.style.cursor = 'move';
    startHandle.style.pointerEvents = 'all';
    group.appendChild(startHandle);

    // Create draggable handle for end point (x2, y2)
    const endHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    endHandle.setAttribute('cx', x2.toString());
    endHandle.setAttribute('cy', y2.toString());
    endHandle.setAttribute('r', handleRadius.toString());
    endHandle.setAttribute('fill', (annotation.properties.color as string) || '#000000');
    endHandle.setAttribute('stroke', '#ffffff');
    endHandle.setAttribute('stroke-width', '2');
    endHandle.setAttribute('data-arrow-end', 'end');
    endHandle.style.cursor = 'move';
    endHandle.style.pointerEvents = 'all';
    group.appendChild(endHandle);

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
    rect.style.cursor = 'move';
    rect.style.userSelect = 'none';

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
