import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpectrogramRenderService } from '@application/services/SpectrogramRenderService';
import { CanvasSpectrogramRenderer } from '@infrastructure/renderer/CanvasSpectrogramRenderer';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { RenderOptions } from '@domain/interfaces/IRenderer';

describe('SpectrogramRenderService', () => {
  let service: SpectrogramRenderService;
  let mockRenderer: any;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    mockRenderer = {
      render: vi.fn(),
      getCanvas: vi.fn().mockReturnValue(mockCanvas),
      addAnnotation: vi.fn(),
      removeAnnotation: vi.fn(),
      clearAnnotations: vi.fn(),
    };

    service = new SpectrogramRenderService(mockRenderer);
  });

  it('should create service instance', () => {
    expect(service).toBeInstanceOf(SpectrogramRenderService);
  });

  it('should render spectrogram', () => {
    const nFreqBins = 1025;
    const nTimeFrames = 10;
    const data = new Float32Array(nFreqBins * nTimeFrames);
    const spectrogram = new Spectrogram(data, nFreqBins, nTimeFrames, 44100, 2048, 512);

    const options: RenderOptions = {
      colormap: 'viridis',
      brightness: 1.0,
      contrast: 1.0,
      gamma: 1.0,
      showAxes: true,
      showColorbar: true,
      dbMin: -80,
      dbMax: 0,
    };

    service.render(spectrogram, options);

    expect(mockRenderer.render).toHaveBeenCalledWith(spectrogram, options);
  });

  it('should add annotation', () => {
    const annotation = {
      type: 'text' as const,
      position: { x: 100, y: 200 },
      properties: { text: 'Test' },
      id: 'test-id',
    };

    service.addAnnotation(annotation as any);

    expect(mockRenderer.addAnnotation).toHaveBeenCalledWith(annotation);
  });

  it('should get canvas', () => {
    const canvas = service.getCanvas();
    expect(canvas).toBe(mockCanvas);
    expect(mockRenderer.getCanvas).toHaveBeenCalled();
  });
});
