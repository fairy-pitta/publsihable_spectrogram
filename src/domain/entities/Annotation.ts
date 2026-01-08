export enum AnnotationType {
  Text = 'text',
  Arrow = 'arrow',
  Rectangle = 'rectangle',
}

export interface AnnotationProperties {
  [key: string]: number | string | boolean | undefined;
}

export class Annotation {
  public readonly id: string;

  constructor(
    public type: AnnotationType,
    public position: { x: number; y: number },
    public properties: AnnotationProperties,
    id?: string
  ) {
    this.id = id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  withPosition(newPosition: { x: number; y: number }): Annotation {
    return new Annotation(this.type, newPosition, this.properties, this.id);
  }

  withProperties(newProperties: AnnotationProperties): Annotation {
    return new Annotation(this.type, this.position, { ...this.properties, ...newProperties }, this.id);
  }
}
