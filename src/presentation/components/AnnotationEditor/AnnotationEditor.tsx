import React, { useState, useContext, createContext, useEffect } from 'react';
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

interface AnnotationEditorProps {
  annotationService?: AnnotationService;
  addAnnotation?: (annotation: Annotation) => void;
  updateAnnotation?: (annotation: Annotation) => void;
  spectrogramCenter?: { x: number; y: number };
}

export function AnnotationEditor({ annotationService: externalAnnotationService, addAnnotation: externalAddAnnotation, updateAnnotation: externalUpdateAnnotation, spectrogramCenter }: AnnotationEditorProps) {
  const [internalAnnotationService] = useState(() => new AnnotationService());
  const annotationService = externalAnnotationService || internalAnnotationService;
  const [, forceUpdate] = useState({});

  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AnnotationType>(AnnotationType.Text);
  const [text, setText] = useState('');
  const [color, setColor] = useState('#000000');
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [x2, setX2] = useState(0);
  const [y2, setY2] = useState(0);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(50);

  const colorOptions = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#FF0000' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Green', value: '#00FF00' },
    { name: 'Yellow', value: '#FFFF00' },
    { name: 'Orange', value: '#FFA500' },
    { name: 'Purple', value: '#800080' },
    { name: 'Cyan', value: '#00FFFF' },
    { name: 'Magenta', value: '#FF00FF' },
    { name: 'White', value: '#FFFFFF' },
  ];

  // Update position when spectrogram center changes (only for new annotations)
  useEffect(() => {
    if (spectrogramCenter && !editingAnnotationId) {
      setX(spectrogramCenter.x);
      setY(spectrogramCenter.y);
      // For arrow, set x2 and y2 relative to center
      if (selectedType === AnnotationType.Arrow) {
        setX2(spectrogramCenter.x + 50);
        setY2(spectrogramCenter.y + 50);
      }
    }
  }, [spectrogramCenter, selectedType, editingAnnotationId]);

  // Load annotation data when editing
  const handleEdit = (annotation: Annotation) => {
    setEditingAnnotationId(annotation.id);
    setSelectedType(annotation.type);
    setColor((annotation.properties.color as string) || '#000000');
    setX(annotation.position.x);
    setY(annotation.position.y);
    
    if (annotation.type === AnnotationType.Text) {
      setText((annotation.properties.text as string) || '');
    } else if (annotation.type === AnnotationType.Arrow) {
      setX2((annotation.properties.x2 as number) || 0);
      setY2((annotation.properties.y2 as number) || 0);
    } else if (annotation.type === AnnotationType.Rectangle) {
      setWidth((annotation.properties.width as number) || 100);
      setHeight((annotation.properties.height as number) || 50);
    }
  };

  const handleCancelEdit = () => {
    setEditingAnnotationId(null);
    setText('');
    setColor('#000000');
    setX(0);
    setY(0);
    setX2(0);
    setY2(0);
    setWidth(100);
    setHeight(50);
    setSelectedType(AnnotationType.Text);
  };

  const handleSave = () => {
    let properties: any = {};

    switch (selectedType) {
      case AnnotationType.Text:
        properties = { text: text || 'Annotation', color };
        break;
      case AnnotationType.Arrow:
        properties = { x2, y2, color };
        break;
      case AnnotationType.Rectangle:
        properties = { width, height, color };
        break;
    }

    // Use spectrogram center if available and not editing, otherwise use current x, y
    const position = (editingAnnotationId || !spectrogramCenter) ? { x, y } : spectrogramCenter;
    
    if (editingAnnotationId) {
      // Update existing annotation
      const existingAnnotation = annotationService.getAnnotation(editingAnnotationId);
      if (existingAnnotation) {
        const updatedAnnotation = existingAnnotation
          .withPosition(position)
          .withProperties(properties);
        
        // Use external updateAnnotation if available, otherwise update directly
        if (externalUpdateAnnotation) {
          externalUpdateAnnotation(updatedAnnotation);
        } else if (externalAddAnnotation) {
          // Fallback to addAnnotation (it will replace due to same ID)
          externalAddAnnotation(updatedAnnotation);
        } else {
          annotationService.updateAnnotation(updatedAnnotation);
          forceUpdate({});
        }
        handleCancelEdit();
      }
    } else {
      // Create new annotation
      const annotation = new Annotation(selectedType, position, properties);
      
      if (externalAddAnnotation) {
        externalAddAnnotation(annotation);
      } else {
        annotationService.addAnnotation(annotation);
        forceUpdate({});
      }
      
      // Reset form
      handleCancelEdit();
    }
    
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
          <input type="number" value={spectrogramCenter?.x ?? x} onChange={(e) => setX(parseInt(e.target.value))} disabled={!!spectrogramCenter} />
        </label>

        <label>
          Y:
          <input type="number" value={spectrogramCenter?.y ?? y} onChange={(e) => setY(parseInt(e.target.value))} disabled={!!spectrogramCenter} />
        </label>
        {spectrogramCenter && (
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
            Position will be set to center. You can drag the annotation after adding it.
          </p>
        )}

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

        <label>
          Color:
          <div className="color-picker">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setColor(option.value)}
                className={`color-option ${color === option.value ? 'selected' : ''}`}
                style={{
                  backgroundColor: option.value,
                }}
                title={option.name}
              />
            ))}
          </div>
        </label>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button onClick={handleSave}>
            {editingAnnotationId ? 'Update Annotation' : 'Add Annotation'}
          </button>
          {editingAnnotationId && (
            <button onClick={handleCancelEdit}>Cancel</button>
          )}
        </div>
      </div>

      <div className="annotations-list">
        <h3>Current Annotations</h3>
        {annotationService.getAnnotations().map((annotation) => (
          <div key={annotation.id} className="annotation-item">
            <span>
              {annotation.type} ({Math.round(annotation.position.x)}, {Math.round(annotation.position.y)})
              {annotation.properties.color && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '15px',
                    height: '15px',
                    backgroundColor: annotation.properties.color as string,
                    marginLeft: '8px',
                    border: '1px solid #ccc',
                    verticalAlign: 'middle',
                  }}
                />
              )}
            </span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => handleEdit(annotation)}>Edit</button>
              <button onClick={() => { 
                annotationService.removeAnnotation(annotation.id); 
                if (editingAnnotationId === annotation.id) {
                  handleCancelEdit();
                }
                forceUpdate({}); 
              }}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
