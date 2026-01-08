import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportService } from '@application/services/ExportService';
import { CanvasSpectrogramRenderer } from '@infrastructure/renderer/CanvasSpectrogramRenderer';
import { SVGAnnotationLayer } from '@infrastructure/annotation/SVGAnnotationLayer';
import { Spectrogram } from '@domain/entities/Spectrogram';

describe('ExportService', () => {
  let service: ExportService;
  let mockRenderer: any;
  let mockAnnotationLayer: any;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    mockRenderer = {
      getCanvas: vi.fn().mockReturnValue(mockCanvas),
      exportToPNG: vi.fn().mockResolvedValue(new Blob()),
    };

    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mockAnnotationLayer = {
      getSVGString: vi.fn().mockReturnValue('<svg></svg>'),
      getSVG: vi.fn().mockReturnValue(svgElement),
    };

    service = new ExportService(mockRenderer, mockAnnotationLayer);
  });

  it('should create service instance', () => {
    expect(service).toBeInstanceOf(ExportService);
  });

  it('should export to PNG', async () => {
    const blob = await service.exportToPNG();

    expect(mockRenderer.exportToPNG).toHaveBeenCalled();
    expect(blob).toBeInstanceOf(Blob);
  });

  it('should export to PNG with custom DPI', async () => {
    const blob = await service.exportToPNG(600);

    expect(mockRenderer.exportToPNG).toHaveBeenCalledWith(600);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('should export to SVG', () => {
    const svgString = service.exportToSVG();

    expect(mockAnnotationLayer.getSVGString).toHaveBeenCalled();
    expect(typeof svgString).toBe('string');
    expect(svgString).toContain('<svg');
  });
});
