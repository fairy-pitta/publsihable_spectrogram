import { describe, it, expect, beforeEach } from 'vitest';
import { ExportService } from '@application/services/ExportService';
import { CanvasSpectrogramRenderer } from '@infrastructure/renderer/CanvasSpectrogramRenderer';
import { SVGAnnotationLayer } from '@infrastructure/annotation/SVGAnnotationLayer';

describe('ExportService', () => {
  let service: ExportService;
  let renderer: CanvasSpectrogramRenderer;
  let annotationLayer: SVGAnnotationLayer;
  let canvas: HTMLCanvasElement;
  let svgElement: SVGSVGElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    renderer = new CanvasSpectrogramRenderer(canvas);

    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('width', '800');
    svgElement.setAttribute('height', '600');
    annotationLayer = new SVGAnnotationLayer(svgElement);

    service = new ExportService(renderer, annotationLayer);
  });

  it('should create service instance', () => {
    expect(service).toBeInstanceOf(ExportService);
  });

  it('should export to PNG', async () => {
    const blob = await service.exportToPNG();

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
  });

  it('should export to PNG with custom DPI', async () => {
    const blob = await service.exportToPNG(600);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
  });

  it('should export to SVG', () => {
    const svgString = service.exportToSVG();

    expect(typeof svgString).toBe('string');
    expect(svgString).toContain('<svg');
    expect(svgString).toContain('xmlns');
  });
});
