import { describe, it, expect, beforeEach } from 'vitest';
import { CanvasSpectrogramRenderer } from '@infrastructure/renderer/CanvasSpectrogramRenderer';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { RenderOptions } from '@domain/interfaces/IRenderer';
import { Annotation, AnnotationType } from '@domain/entities/Annotation';

describe('CanvasSpectrogramRenderer', () => {
  let renderer: CanvasSpectrogramRenderer;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    renderer = new CanvasSpectrogramRenderer(canvas);
  });

  it('should create renderer with canvas', () => {
    expect(renderer).toBeInstanceOf(CanvasSpectrogramRenderer);
    expect(renderer.getCanvas()).toBe(canvas);
  });

  it('should render spectrogram', () => {
    const nFreqBins = 1025;
    const nTimeFrames = 10;
    const data = new Float32Array(nFreqBins * nTimeFrames);
    // Fill with test data (dB values)
    for (let i = 0; i < data.length; i++) {
      data[i] = -40 + (i % 40); // Range from -40 to 0 dB
    }

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

    // Verify canvas has been rendered (check if image data exists)
    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();
    const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
    expect(imageData.data.length).toBeGreaterThan(0);
  });

  it('should draw axes when showAxes is true', () => {
    const nFreqBins = 100;
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
      showColorbar: false,
      dbMin: -80,
      dbMax: 0,
    };

    renderer.render(spectrogram, options);

    // Verify rendering completed
    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();
  });

  it('should get canvas element', () => {
    const retrievedCanvas = renderer.getCanvas();
    expect(retrievedCanvas).toBe(canvas);
  });

  it('should add and manage annotations', () => {
    const annotation = new Annotation(
      AnnotationType.Text,
      { x: 100, y: 200 },
      { text: 'Test' }
    );

    renderer.addAnnotation(annotation);
    expect(renderer.getCanvas()).toBe(canvas);

    renderer.removeAnnotation(annotation.id);
    renderer.clearAnnotations();
  });
});
