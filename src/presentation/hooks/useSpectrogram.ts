import { useState, useCallback, useEffect } from 'react';
import { SpectrogramRenderService } from '@application/services/SpectrogramRenderService';
import { AnnotationService } from '@application/services/AnnotationService';
import { ExportService } from '@application/services/ExportService';
import { CanvasSpectrogramRenderer } from '@infrastructure/renderer/CanvasSpectrogramRenderer';
import { SVGAnnotationLayer } from '@infrastructure/annotation/SVGAnnotationLayer';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { RenderOptions } from '@domain/interfaces/IRenderer';
import { Annotation } from '@domain/entities/Annotation';

export function useSpectrogram(canvasRef: React.RefObject<HTMLCanvasElement>, svgRef: React.RefObject<SVGSVGElement>) {
  const [renderService, setRenderService] = useState<SpectrogramRenderService | null>(null);
  const [annotationService, setAnnotationService] = useState<AnnotationService>(new AnnotationService());
  const [exportService, setExportService] = useState<ExportService | null>(null);
  const [annotationLayer, setAnnotationLayer] = useState<SVGAnnotationLayer | null>(null);
  const [renderOptions, setRenderOptions] = useState<RenderOptions>({
    colormap: 'viridis',
    brightness: 1.0,
    contrast: 1.0,
    gamma: 1.0,
    showAxes: true,
    showColorbar: true,
    dbMin: -80,
    dbMax: 0,
  });

  useEffect(() => {
    if (canvasRef.current && svgRef.current) {
      const renderer = new CanvasSpectrogramRenderer(canvasRef.current);
      const annotationLayerInstance = new SVGAnnotationLayer(svgRef.current);
      const renderServiceInstance = new SpectrogramRenderService(renderer);
      const exportServiceInstance = new ExportService(renderer, annotationLayerInstance);

      setRenderService(renderServiceInstance);
      setExportService(exportServiceInstance);
      setAnnotationLayer(annotationLayerInstance);

      // Sync annotations
      const updateAnnotations = () => {
        annotationService.getAnnotations().forEach((annotation) => {
          renderServiceInstance.addAnnotation(annotation);
          annotationLayerInstance.addAnnotation(annotation);
        });
      };

      updateAnnotations();
    }
  }, [canvasRef, svgRef, annotationService]);

  const render = useCallback((spectrogram: Spectrogram, options?: Partial<RenderOptions>) => {
    if (!renderService) return;

    const finalOptions = { ...renderOptions, ...options };
    renderService.render(spectrogram, finalOptions);
  }, [renderService, renderOptions]);

  const addAnnotation = useCallback((annotation: Annotation) => {
    annotationService.addAnnotation(annotation);
    renderService?.addAnnotation(annotation);
    annotationLayer?.addAnnotation(annotation);
  }, [annotationService, renderService, annotationLayer]);

  const updateAnnotation = useCallback((annotation: Annotation) => {
    annotationService.updateAnnotation(annotation);
    renderService?.addAnnotation(annotation);
    annotationLayer?.updateAnnotation(annotation);
  }, [annotationService, renderService, annotationLayer]);

  const removeAnnotation = useCallback((annotationId: string) => {
    annotationService.removeAnnotation(annotationId);
    renderService?.removeAnnotation(annotationId);
    annotationLayer?.removeAnnotation(annotationId);
  }, [annotationService, renderService, annotationLayer]);

  const clearAnnotations = useCallback(() => {
    annotationService.clearAnnotations();
    renderService?.clearAnnotations();
    annotationLayer?.clearAnnotations();
  }, [annotationService, renderService, annotationLayer]);

  const updateRenderOptions = useCallback((options: Partial<RenderOptions>) => {
    setRenderOptions((prev) => ({ ...prev, ...options }));
  }, []);

  const exportToPNG = useCallback(async (dpi: number = 300) => {
    if (!exportService) throw new Error('Export service not available');
    return exportService.exportToPNG(dpi);
  }, [exportService]);

  const exportToSVG = useCallback(() => {
    if (!exportService) throw new Error('Export service not available');
    return exportService.exportToSVG();
  }, [exportService]);

  const downloadPNG = useCallback(async (filename: string = 'spectrogram.png', dpi: number = 300) => {
    if (!exportService) throw new Error('Export service not available');
    return exportService.downloadPNG(filename, dpi);
  }, [exportService]);

  const downloadSVG = useCallback((filename: string = 'spectrogram.svg') => {
    if (!exportService) throw new Error('Export service not available');
    return exportService.downloadSVG(filename);
  }, [exportService]);

  return {
    render,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
    updateRenderOptions,
    renderOptions,
    exportToPNG,
    exportToSVG,
    downloadPNG,
    downloadSVG,
    annotations: annotationService.getAnnotations(),
    annotationService,
    isReady: renderService !== null && exportService !== null,
  };
}
