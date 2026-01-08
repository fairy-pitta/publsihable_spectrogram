import React, { useState, useContext, createContext } from 'react';
import { Annotation, AnnotationType } from '@domain/entities/Annotation';
import { AnnotationService } from '@application/services/AnnotationService';
import './AnnotationEditor.css';

const AnnotationServiceContext = createContext<AnnotationService | null>(null);

export function AnnotationEditorProvider({ children, annotationService }: { children: React.ReactNode; annotationService: AnnotationService }) {
  return (
    <AnnotationServiceContext.Provider value={annotationService}>
      {children}
    </AnnotationServiceContext.Provider>
  );
}

export function AnnotationEditor() {
  const [annotationService] = useState(() => new AnnotationService());
  const [, forceUpdate] = useState({});

  const [selectedType, setSelectedType] = useState<AnnotationType>(AnnotationType.Text);
  const [text, setText] = useState('');
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [x2, setX2] = useState(0);
  const [y2, setY2] = useState(0);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(50);

  const handleAdd = () => {
    let properties: any = {};

    switch (selectedType) {
      case AnnotationType.Text:
        properties = { text };
        break;
      case AnnotationType.Arrow:
        properties = { x2, y2 };
        break;
      case AnnotationType.Rectangle:
        properties = { width, height };
        break;
    }

    const annotation = new Annotation(selectedType, { x, y }, properties);
    annotationService.addAnnotation(annotation);
    // Trigger re-render
    forceUpdate({});
  };

  return (
    <div className="annotation-editor">
      <h2>Annotations</h2>

      <div className="annotation-form">
        <label>
          Type:
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as AnnotationType)}>
            <option value={AnnotationType.Text}>Text</option>
            <option value={AnnotationType.Arrow}>Arrow</option>
            <option value={AnnotationType.Rectangle}>Rectangle</option>
          </select>
        </label>

        <label>
          X:
          <input type="number" value={x} onChange={(e) => setX(parseInt(e.target.value))} />
        </label>

        <label>
          Y:
          <input type="number" value={y} onChange={(e) => setY(parseInt(e.target.value))} />
        </label>

        {selectedType === AnnotationType.Text && (
          <label>
            Text:
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
          </label>
        )}

        {selectedType === AnnotationType.Arrow && (
          <>
            <label>
              X2:
              <input type="number" value={x2} onChange={(e) => setX2(parseInt(e.target.value))} />
            </label>
            <label>
              Y2:
              <input type="number" value={y2} onChange={(e) => setY2(parseInt(e.target.value))} />
            </label>
          </>
        )}

        {selectedType === AnnotationType.Rectangle && (
          <>
            <label>
              Width:
              <input type="number" value={width} onChange={(e) => setWidth(parseInt(e.target.value))} />
            </label>
            <label>
              Height:
              <input type="number" value={height} onChange={(e) => setHeight(parseInt(e.target.value))} />
            </label>
          </>
        )}

        <button onClick={handleAdd}>Add Annotation</button>
      </div>

      <div className="annotations-list">
        <h3>Current Annotations</h3>
        {annotationService.getAnnotations().map((annotation) => (
          <div key={annotation.id} className="annotation-item">
            <span>{annotation.type}</span>
            <button onClick={() => { annotationService.removeAnnotation(annotation.id); forceUpdate({}); }}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
