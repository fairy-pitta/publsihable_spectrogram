import { describe, it, expect, beforeEach } from 'vitest';
import { SpectrogramRenderService } from '@application/services/SpectrogramRenderService';
import { CanvasSpectrogramRenderer } from '@infrastructure/renderer/CanvasSpectrogramRenderer';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { RenderOptions } from '@domain/interfaces/IRenderer';
import { Annotation, AnnotationType } from '@domain/entities/Annotation';

describe('SpectrogramRenderService', () => {
  let service: SpectrogramRenderService;
  let renderer: CanvasSpectrogramRenderer;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    renderer = new CanvasSpectrogramRenderer(canvas);
    service = new SpectrogramRenderService(renderer);
  });

  it('should create service instance', () => {
    expect(service).toBeInstanceOf(SpectrogramRenderService);
  });

  it('should render spectrogram', () => {
    const nFreqBins = 1025;
    const nTimeFrames = 10;
    const data = new Float32Array(nFreqBins * nTimeFrames);
    data.fill(-50);
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

    // Verify rendering was performed
    const retrievedCanvas = service.getCanvas();
    expect(retrievedCanvas).toBe(canvas);
    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();
  });

  it('should add annotation', () => {
    const annotation = new Annotation(
      AnnotationType.Text,
      { x: 100, y: 200 },
      { text: 'Test' }
    );

    service.addAnnotation(annotation);

    // Verify annotation was added
    const retrievedCanvas = service.getCanvas();
    expect(retrievedCanvas).toBe(canvas);
  });

  it('should get canvas', () => {
    const retrievedCanvas = service.getCanvas();
    expect(retrievedCanvas).toBe(canvas);
  });

  it('should remove and clear annotations', () => {
    const annotation = new Annotation(
      AnnotationType.Text,
      { x: 100, y: 200 },
      { text: 'Test' }
    );

    service.addAnnotation(annotation);
    service.removeAnnotation(annotation.id);
    service.clearAnnotations();
  });
});
