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
    public properties: AnnotationProperties
  ) {
    this.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
