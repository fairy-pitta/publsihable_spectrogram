import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasSpectrogramRenderer } from '@infrastructure/renderer/CanvasSpectrogramRenderer';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { RenderOptions } from '@domain/interfaces/IRenderer';

describe('CanvasSpectrogramRenderer', () => {
  let renderer: CanvasSpectrogramRenderer;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    mockContext = {
      fillStyle: '',
      fillRect: vi.fn(),
      strokeStyle: '',
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      font: '',
      textAlign: '',
      textBaseline: '',
      clearRect: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      canvas: {} as HTMLCanvasElement,
    } as any;

    mockCanvas = {
      getContext: vi.fn().mockReturnValue(mockContext),
      width: 800,
      height: 600,
      style: {} as CSSStyleDeclaration,
    } as any;

    renderer = new CanvasSpectrogramRenderer(mockCanvas);
  });

  it('should create renderer with canvas', () => {
    expect(renderer).toBeInstanceOf(CanvasSpectrogramRenderer);
    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
  });

  it('should render spectrogram', () => {
    const nFreqBins = 1025;
    const nTimeFrames = 10;
    const data = new Float32Array(nFreqBins * nTimeFrames);
    data.fill(0.5);

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

    renderer.render(spectrogram, options);

    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.fillRect).toHaveBeenCalled();
  });

  it('should draw axes when showAxes is true', () => {
    const nFreqBins = 100;
    const nTimeFrames = 10;
    const data = new Float32Array(nFreqBins * nTimeFrames);
    const spectrogram = new Spectrogram(data, nFreqBins, nTimeFrames, 44100, 2048, 512);

    const options: RenderOptions = {
      colormap: 'viridis',
      brightness: 1.0,
      contrast: 1.0,
      gamma: 1.0,
      showAxes: true,
      showColorbar: false,
      dbMin: -80,
      dbMax: 0,
    };

    renderer.render(spectrogram, options);

    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
  });

  it('should get canvas element', () => {
    const canvas = renderer.getCanvas();
    expect(canvas).toBe(mockCanvas);
  });

  it('should add annotation', () => {
    const annotation = {
      type: 'text' as const,
      position: { x: 100, y: 200 },
      properties: { text: 'Test' },
      id: 'test-id',
    };

    renderer.addAnnotation(annotation as any);
    expect(renderer.getCanvas()).toBe(mockCanvas);
  });
});
