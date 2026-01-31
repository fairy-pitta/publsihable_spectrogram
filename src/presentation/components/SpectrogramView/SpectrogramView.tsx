import { useRef, useEffect } from 'react';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { useSpectrogram } from '../../hooks/useSpectrogram';
import { RenderOptions } from '@domain/interfaces/IRenderer';
import { AnnotationService } from '@application/services/AnnotationService';
import { Annotation, AnnotationType } from '@domain/entities/Annotation';
import './SpectrogramView.css';

interface SpectrogramViewProps {
  spectrogram: Spectrogram | null;
  renderOptions: RenderOptions;
  onRender?: () => void;
  onAnnotationServiceReady?: (annotationService: AnnotationService) => void;
  onAddAnnotationReady?: (addAnnotation: (annotation: Annotation) => void) => void;
  onUpdateAnnotationReady?: (updateAnnotation: (annotation: Annotation) => void) => void;
  onCenterReady?: (center: { x: number; y: number }) => void;
  onExportServiceReady?: (exportService: import('@application/services/ExportService').ExportService) => void;
}

export function SpectrogramView({ spectrogram, renderOptions, onRender, onAnnotationServiceReady, onAddAnnotationReady, onUpdateAnnotationReady, onCenterReady, onExportServiceReady }: SpectrogramViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { render, updateAnnotation, annotationService, addAnnotation, exportService } = useSpectrogram(canvasRef, svgRef);
  const dragStateRef = useRef<{ 
    annotationId: string | null; 
    offsetX: number; 
    offsetY: number;
    isArrowEnd?: 'start' | 'end' | null;
    pointerId?: number | null;
  } | null>(null);

  useEffect(() => {
    if (annotationService && onAnnotationServiceReady) {
      onAnnotationServiceReady(annotationService);
    }
  }, [annotationService, onAnnotationServiceReady]);

  useEffect(() => {
    if (addAnnotation && onAddAnnotationReady) {
      onAddAnnotationReady(addAnnotation);
    }
  }, [addAnnotation, onAddAnnotationReady]);

  useEffect(() => {
    if (updateAnnotation && onUpdateAnnotationReady) {
      onUpdateAnnotationReady(updateAnnotation);
    }
  }, [updateAnnotation, onUpdateAnnotationReady]);

  useEffect(() => {
    if (exportService && onExportServiceReady) {
      onExportServiceReady(exportService);
    }
  }, [exportService, onExportServiceReady]);

  useEffect(() => {
    if (spectrogram && canvasRef.current && svgRef.current) {
      const updateCanvasSize = () => {
        if (canvasRef.current && svgRef.current) {
          // Let CanvasSpectrogramRenderer handle high DPI setup
          // Just ensure SVG matches canvas display size
          const rect = canvasRef.current.getBoundingClientRect();
          svgRef.current.setAttribute('width', rect.width.toString());
          svgRef.current.setAttribute('height', rect.height.toString());
          
          // Calculate and notify center position
          if (onCenterReady) {
            const marginLeft = renderOptions.showAxes ? 60 : 0;
            const marginBottom = renderOptions.showAxes ? 40 : 0;
            const marginRight = renderOptions.showColorbar ? 80 : 0;
            const marginTop = 20;
            const plotWidth = rect.width - marginLeft - marginRight;
            const plotHeight = rect.height - marginTop - marginBottom;
            const centerX = marginLeft + plotWidth / 2;
            const centerY = marginTop + plotHeight / 2;
            onCenterReady({ x: centerX, y: centerY });
          }
        }
      };

      updateCanvasSize();
      render(spectrogram, renderOptions);
      onRender?.();

      // Handle window resize
      window.addEventListener('resize', updateCanvasSize);
      return () => window.removeEventListener('resize', updateCanvasSize);
    }
  }, [spectrogram, renderOptions, render, onRender, onCenterReady]);

  // Setup drag handlers for annotations
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (!annotationService) return;

    const getAnnotationIdFromTarget = (target: Element) => {
      // Try to find annotation ID by traversing up the DOM tree
      let annotationId: string | null = null;
      let currentElement: Element | null = target;
      while (currentElement && !annotationId) {
        annotationId = currentElement.getAttribute('data-annotation-id');
        if (!annotationId && currentElement.parentElement) {
          currentElement = currentElement.parentElement;
        } else {
          break;
        }
      }
      return annotationId;
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      if (!annotationService) return;

      const annotationId = getAnnotationIdFromTarget(target);
      
      // Check if this is an arrow end handle
      const arrowEnd = (target as Element).getAttribute('data-arrow-end') as 'start' | 'end' | null;
      
      if (annotationId) {
        const annotation = annotationService.getAnnotation(annotationId);
        if (annotation) {
          const svgRect = svg.getBoundingClientRect();
          
          if (arrowEnd && annotation.type === AnnotationType.Arrow) {
            // Dragging an arrow end handle
            const x = arrowEnd === 'start' ? annotation.position.x : Number(annotation.properties.x2 || 0);
            const y = arrowEnd === 'start' ? annotation.position.y : Number(annotation.properties.y2 || 0);
            const offsetX = e.clientX - svgRect.left - x;
            const offsetY = e.clientY - svgRect.top - y;
            dragStateRef.current = { annotationId, offsetX, offsetY, isArrowEnd: arrowEnd, pointerId: e.pointerId };
          } else {
            // Dragging the entire annotation
            const offsetX = e.clientX - svgRect.left - annotation.position.x;
            const offsetY = e.clientY - svgRect.top - annotation.position.y;
            dragStateRef.current = { annotationId, offsetX, offsetY, isArrowEnd: null, pointerId: e.pointerId };
          }

          // Capture pointer so dragging continues outside element.
          try {
            svg.setPointerCapture(e.pointerId);
          } catch {
            // Some browsers may throw if capture not possible; ignore.
          }

          e.preventDefault();
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (dragStateRef.current && svg) {
        if (dragStateRef.current.pointerId != null && dragStateRef.current.pointerId !== e.pointerId) {
          return;
        }
        const svgRect = svg.getBoundingClientRect();
        const newX = e.clientX - svgRect.left - dragStateRef.current.offsetX;
        const newY = e.clientY - svgRect.top - dragStateRef.current.offsetY;
        
        const annotationId = dragStateRef.current.annotationId;
        if (!annotationId) return;
        
        if (!annotationService) return;
        const annotation = annotationService.getAnnotation(annotationId);
        if (annotation && updateAnnotation) {
          if (dragStateRef.current.isArrowEnd && annotation.type === AnnotationType.Arrow) {
            // Update arrow end position
            if (dragStateRef.current.isArrowEnd === 'start') {
              // Update start position (annotation.position)
              const updatedAnnotation = annotation.withPosition({ x: newX, y: newY });
              updateAnnotation(updatedAnnotation);
            } else {
              // Update end position (x2, y2)
              const updatedAnnotation = annotation.withProperties({ x2: newX, y2: newY });
              updateAnnotation(updatedAnnotation);
            }
          } else {
            // Update entire annotation position
            const updatedAnnotation = annotation.withPosition({ x: newX, y: newY });
            updateAnnotation(updatedAnnotation);
          }
        }

        e.preventDefault();
      }
    };

    const stopDragging = (pointerId?: number) => {
      if (pointerId != null) {
        try {
          svg.releasePointerCapture(pointerId);
        } catch {
          // ignore
        }
      }
      dragStateRef.current = null;
    };

    const handlePointerUp = (e: PointerEvent) => stopDragging(e.pointerId);
    const handlePointerCancel = (e: PointerEvent) => stopDragging(e.pointerId);

    svg.addEventListener('pointerdown', handlePointerDown, { passive: false });
    svg.addEventListener('pointermove', handlePointerMove, { passive: false });
    svg.addEventListener('pointerup', handlePointerUp);
    svg.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      svg.removeEventListener('pointerdown', handlePointerDown);
      svg.removeEventListener('pointermove', handlePointerMove);
      svg.removeEventListener('pointerup', handlePointerUp);
      svg.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [updateAnnotation, annotationService]);

  return (
    <div className="spectrogram-view">
      <div className="spectrogram-container">
        <canvas ref={canvasRef} className="spectrogram-canvas" />
        <svg ref={svgRef} className="spectrogram-annotations" />
      </div>
    </div>
  );
}
