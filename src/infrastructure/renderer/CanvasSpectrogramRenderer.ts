import { IRenderer, RenderOptions } from '@domain/interfaces/IRenderer';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { Annotation } from '@domain/entities/Annotation';
import { Colormap } from './Colormap';

export class CanvasSpectrogramRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private annotations: Map<string, Annotation> = new Map();
  private dpr: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    // Enable antialiasing for smoother rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    this.context = ctx;
    this.dpr = window.devicePixelRatio || 1;
  }

  render(spectrogram: Spectrogram, options: RenderOptions): void {
    try {
      const ctx = this.context;
      
      // Get canvas display size with multiple fallbacks
      const rect = this.canvas.getBoundingClientRect();
      let displayWidth = rect.width;
      let displayHeight = rect.height;
      
      // Fallback chain for width
      if (!displayWidth || displayWidth === 0 || isNaN(displayWidth)) {
        displayWidth = this.canvas.offsetWidth || this.canvas.clientWidth || 800;
      }
      
      // Fallback chain for height
      if (!displayHeight || displayHeight === 0 || isNaN(displayHeight)) {
        displayHeight = this.canvas.offsetHeight || this.canvas.clientHeight || 600;
      }
      
      // Ensure minimum size
      displayWidth = Math.max(displayWidth, 100);
      displayHeight = Math.max(displayHeight, 100);
      
      // Setup canvas size (simplified - high DPI can be re-enabled later if needed)
      if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
        // Reset transform to avoid accumulation
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Set canvas size
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
      }
      
      // Use canvas dimensions for rendering calculations
      const width = this.canvas.width;
      const height = this.canvas.height;

      // Fill canvas with white background first
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      // Validate spectrogram data
      if (!spectrogram || !spectrogram.data || spectrogram.data.length === 0) {
        console.warn('Invalid spectrogram data:', spectrogram);
        return;
      }
      
      if (spectrogram.nFreqBins === 0 || spectrogram.nTimeFrames === 0) {
        console.warn('Spectrogram has zero dimensions:', spectrogram);
        return;
      }

    // Calculate rendering area (leave space for axes and colorbar)
    const marginLeft = options.showAxes ? 60 : 0;
    const marginBottom = options.showAxes ? 40 : 0;
    const marginRight = options.showColorbar ? 80 : 0;
    const marginTop = 20;

    const plotWidth = Math.max(1, width - marginLeft - marginRight);
    const plotHeight = Math.max(1, height - marginTop - marginBottom);
    const plotX = marginLeft;
    const plotY = marginTop;

    // Render spectrogram
    const imageData = ctx.createImageData(plotWidth, plotHeight);
    const { data } = imageData;

    // Calculate actual data range from spectrogram
    let actualMinDb = Infinity;
    let actualMaxDb = -Infinity;
    let validDataCount = 0;
    for (let i = 0; i < spectrogram.data.length; i++) {
      const value = spectrogram.data[i];
      if (Number.isFinite(value)) {
        actualMinDb = Math.min(actualMinDb, value);
        actualMaxDb = Math.max(actualMaxDb, value);
        validDataCount++;
      }
    }
    
    // Use actual data range if it's valid, otherwise fall back to options
    const minDb = Number.isFinite(actualMinDb) && validDataCount > 0 ? actualMinDb : options.dbMin;
    const maxDb = Number.isFinite(actualMaxDb) && validDataCount > 0 ? actualMaxDb : options.dbMax;
    const dbRange = maxDb - minDb;
    
    const smoothing = options.smoothing ?? 0.0;
    const useOversampling = options.oversampling ?? false;

    // Apply smoothing if requested (with error handling)
    let smoothedSpectrogram = spectrogram;
    if (smoothing > 0.0 && smoothing <= 1.0) {
      try {
        smoothedSpectrogram = this.applySmoothing(spectrogram, smoothing);
      } catch (error) {
        console.warn('Smoothing failed, using original spectrogram:', error);
        smoothedSpectrogram = spectrogram;
      }
    }

    // Apply oversampling if requested (with error handling)
    let finalSpectrogram = smoothedSpectrogram;
    if (useOversampling) {
      try {
        finalSpectrogram = this.applyOversampling(smoothedSpectrogram);
      } catch (error) {
        console.warn('Oversampling failed, using original spectrogram:', error);
        finalSpectrogram = smoothedSpectrogram;
      }
    }

    for (let y = 0; y < plotHeight; y++) {
      for (let x = 0; x < plotWidth; x++) {
        // Use continuous coordinates for interpolation
        const freqBin = (y / plotHeight) * finalSpectrogram.nFreqBins;
        const timeFrame = (x / plotWidth) * finalSpectrogram.nTimeFrames;

        // Use bilinear interpolation for smoother rendering
        const dbValue = this.bilinearInterpolation(finalSpectrogram, freqBin, timeFrame);
        
        // Normalize dbValue to [0, 1] range with proper handling of edge cases
        let normalized: number;
        if (!Number.isFinite(dbValue)) {
          // Handle NaN or Infinity values
          normalized = 0;
        } else if (dbRange <= 0 || Math.abs(dbRange) < 1e-10) {
          // Handle case where dbRange is zero or very small
          normalized = 0.5;
        } else {
          normalized = (dbValue - minDb) / dbRange;
          // Clamp normalized value to [0, 1] range
          normalized = Math.max(0, Math.min(1, normalized));
        }
        
        const [r, g, b] = Colormap.valueToColor(
          normalized,
          0,
          1,
          options.colormap,
          options.brightness,
          options.contrast,
          options.gamma
        );

        const index = (y * plotWidth + x) * 4;
        data[index] = Math.floor(r * 255);
        data[index + 1] = Math.floor(g * 255);
        data[index + 2] = Math.floor(b * 255);
        data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, plotX, plotY);

    // Draw axes
    if (options.showAxes) {
      this.drawAxes(spectrogram, plotX, plotY, plotWidth, plotHeight, ctx);
    }

    // Draw colorbar
    if (options.showColorbar) {
      this.drawColorbar(plotX + plotWidth + 10, plotY, 20, plotHeight, options, ctx);
    }

    // Draw annotations
    this.drawAnnotations(ctx);
    } catch (error) {
      console.error('Error rendering spectrogram:', error);
      throw error;
    }
  }


  private bilinearInterpolation(
    spectrogram: Spectrogram,
    freqBin: number,
    timeFrame: number
  ): number {
    // Clamp coordinates to valid range
    const clampedFreqBin = Math.max(0, Math.min(freqBin, spectrogram.nFreqBins - 1));
    const clampedTimeFrame = Math.max(0, Math.min(timeFrame, spectrogram.nTimeFrames - 1));

    // Get integer coordinates
    const f0 = Math.floor(clampedFreqBin);
    const f1 = Math.min(f0 + 1, spectrogram.nFreqBins - 1);
    const t0 = Math.floor(clampedTimeFrame);
    const t1 = Math.min(t0 + 1, spectrogram.nTimeFrames - 1);

    // Get fractional parts
    const df = clampedFreqBin - f0;
    const dt = clampedTimeFrame - t0;

    // Get values at four corners
    const v00 = spectrogram.getValue(f0, t0);
    const v01 = spectrogram.getValue(f0, t1);
    const v10 = spectrogram.getValue(f1, t0);
    const v11 = spectrogram.getValue(f1, t1);

    // Check for invalid values and replace with 0
    const safeV00 = Number.isFinite(v00) ? v00 : 0;
    const safeV01 = Number.isFinite(v01) ? v01 : 0;
    const safeV10 = Number.isFinite(v10) ? v10 : 0;
    const safeV11 = Number.isFinite(v11) ? v11 : 0;

    // Bilinear interpolation: first interpolate along time axis, then along frequency axis
    const v0 = safeV00 * (1 - dt) + safeV01 * dt;
    const v1 = safeV10 * (1 - dt) + safeV11 * dt;
    const result = v0 * (1 - df) + v1 * df;
    
    // Ensure result is finite
    return Number.isFinite(result) ? result : 0;
  }

  private applySmoothing(spectrogram: Spectrogram, smoothing: number): Spectrogram {
    // Apply Gaussian smoothing filter
    // Simple 3x3 Gaussian kernel for smoothing
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1],
    ];
    const weight = smoothing; // 0.0 = no smoothing, 1.0 = full smoothing

    const smoothedData = new Float32Array(spectrogram.data.length);

    for (let t = 0; t < spectrogram.nTimeFrames; t++) {
      for (let f = 0; f < spectrogram.nFreqBins; f++) {
        let sum = 0;
        let totalWeight = 0;

        // Apply kernel
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const ni = f + di;
            const nj = t + dj;
            if (ni >= 0 && ni < spectrogram.nFreqBins && nj >= 0 && nj < spectrogram.nTimeFrames) {
              const kernelValue = kernel[di + 1][dj + 1];
              const value = spectrogram.getValue(ni, nj);
              sum += value * kernelValue;
              totalWeight += kernelValue;
            }
          }
        }

        const smoothedValue = sum / totalWeight;
        const originalValue = spectrogram.getValue(f, t);
        const finalValue = originalValue * (1 - weight) + smoothedValue * weight;
        smoothedData[f * spectrogram.nTimeFrames + t] = finalValue;
      }
    }

    return new Spectrogram(
      smoothedData,
      spectrogram.nFreqBins,
      spectrogram.nTimeFrames,
      spectrogram.sampleRate,
      spectrogram.nFft,
      spectrogram.hopLength
    );
  }

  private applyOversampling(spectrogram: Spectrogram): Spectrogram {
    // Oversample by interpolating time frames (2x oversampling)
    const oversampleFactor = 2;
    const newNTimeFrames = spectrogram.nTimeFrames * oversampleFactor;
    const oversampledData = new Float32Array(spectrogram.nFreqBins * newNTimeFrames);

    for (let f = 0; f < spectrogram.nFreqBins; f++) {
      for (let t = 0; t < newNTimeFrames; t++) {
        const originalTimeFrame = t / oversampleFactor;
        const t0 = Math.floor(originalTimeFrame);
        const t1 = Math.min(t0 + 1, spectrogram.nTimeFrames - 1);
        const dt = originalTimeFrame - t0;

        const v0 = spectrogram.getValue(f, t0);
        const v1 = spectrogram.getValue(f, t1);
        const interpolated = v0 * (1 - dt) + v1 * dt;

        oversampledData[f * newNTimeFrames + t] = interpolated;
      }
    }

    return new Spectrogram(
      oversampledData,
      spectrogram.nFreqBins,
      newNTimeFrames,
      spectrogram.sampleRate,
      spectrogram.nFft,
      spectrogram.hopLength / oversampleFactor // Adjusted hop length for oversampling
    );
  }

  private drawAxes(
    spectrogram: Spectrogram,
    x: number,
    y: number,
    width: number,
    height: number,
    ctx: CanvasRenderingContext2D
  ): void {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    // Draw axes
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();

    // Draw time axis labels
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const numTimeTicks = 5;
    for (let i = 0; i <= numTimeTicks; i++) {
      const t = (i / numTimeTicks) * spectrogram.duration;
      const xPos = x + (i / numTimeTicks) * width;
      ctx.fillText(t.toFixed(2) + 's', xPos, y + height + 5);
    }

    // Draw frequency axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const maxFreq = spectrogram.getFrequency(spectrogram.nFreqBins - 1);
    const numFreqTicks = 5;
    for (let i = 0; i <= numFreqTicks; i++) {
      const freq = (i / numFreqTicks) * maxFreq;
      const yPos = y + height - (i / numFreqTicks) * height;
      ctx.fillText(freq.toFixed(0) + 'Hz', x - 5, yPos);
    }
  }

  private drawColorbar(
    x: number,
    y: number,
    width: number,
    height: number,
    options: RenderOptions,
    ctx: CanvasRenderingContext2D
  ): void {
    const imageData = ctx.createImageData(width, height);
    const { data } = imageData;

    for (let i = 0; i < height; i++) {
      const normalized = 1 - (i / height);
      const [r, g, b] = Colormap.valueToColor(
        normalized,
        0,
        1,
        options.colormap,
        options.brightness,
        options.contrast,
        options.gamma
      );

      for (let j = 0; j < width; j++) {
        const index = (i * width + j) * 4;
        data[index] = Math.floor(r * 255);
        data[index + 1] = Math.floor(g * 255);
        data[index + 2] = Math.floor(b * 255);
        data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, x, y);

    // Draw colorbar labels
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(options.dbMax.toFixed(0) + 'dB', x + width + 5, y);

    ctx.textBaseline = 'bottom';
    ctx.fillText(options.dbMin.toFixed(0) + 'dB', x + width + 5, y + height);
  }

  private drawAnnotations(ctx: CanvasRenderingContext2D): void {
    this.annotations.forEach((annotation) => {
      ctx.save();

      switch (annotation.type) {
        case 'text':
          this.drawTextAnnotation(annotation, ctx);
          break;
        case 'arrow':
          this.drawArrowAnnotation(annotation, ctx);
          break;
        case 'rectangle':
          this.drawRectangleAnnotation(annotation, ctx);
          break;
      }

      ctx.restore();
    });
  }

  private drawTextAnnotation(annotation: Annotation, ctx: CanvasRenderingContext2D): void {
    const text = annotation.properties.text as string | undefined;
    if (!text) return;

    ctx.font = '14px sans-serif';
    ctx.fillStyle = annotation.properties.color as string || '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, annotation.position.x, annotation.position.y);
  }

  private drawArrowAnnotation(annotation: Annotation, ctx: CanvasRenderingContext2D): void {
    const x1 = annotation.position.x;
    const y1 = annotation.position.y;
    const x2 = annotation.properties.x2 as number;
    const y2 = annotation.properties.y2 as number;

    if (x2 === undefined || y2 === undefined) return;

    ctx.strokeStyle = annotation.properties.color as string || '#000000';
    ctx.lineWidth = (annotation.properties.width as number) || 2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw arrowhead
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle - arrowAngle),
      y2 - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle + arrowAngle),
      y2 - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
  }

  private drawRectangleAnnotation(annotation: Annotation, ctx: CanvasRenderingContext2D): void {
    const width = annotation.properties.width as number;
    const height = annotation.properties.height as number;

    if (width === undefined || height === undefined) return;

    ctx.strokeStyle = annotation.properties.color as string || '#000000';
    ctx.fillStyle = annotation.properties.fillColor as string || 'transparent';
    ctx.lineWidth = (annotation.properties.lineWidth as number) || 2;

    if (ctx.fillStyle !== 'transparent') {
      ctx.fillRect(annotation.position.x, annotation.position.y, width, height);
    }
    ctx.strokeRect(annotation.position.x, annotation.position.y, width, height);
  }

  addAnnotation(annotation: Annotation): void {
    this.annotations.set(annotation.id, annotation);
  }

  removeAnnotation(annotationId: string): void {
    this.annotations.delete(annotationId);
  }

  clearAnnotations(): void {
    this.annotations.clear();
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  exportToSVG(): string {
    // SVG export will be handled by combining canvas and annotations
    // For now, return empty string - will be implemented in ExportService
    return '';
  }

  async exportToPNG(dpi: number = 300): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Calculate scale factor based on DPI
        // Standard screen DPI is 96, so scale = targetDPI / 96
        const scale = dpi / 96;
        
        // Get current canvas dimensions
        const displayWidth = this.canvas.width;
        const displayHeight = this.canvas.height;
        
        // Create a temporary canvas for high-resolution export
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = displayWidth * scale;
        exportCanvas.height = displayHeight * scale;
        
        const exportCtx = exportCanvas.getContext('2d');
        if (!exportCtx) {
          reject(new Error('Failed to get 2D context for export canvas'));
          return;
        }
        
        // Enable high-quality rendering
        exportCtx.imageSmoothingEnabled = true;
        exportCtx.imageSmoothingQuality = 'high';
        
        // Draw the current canvas scaled up
        exportCtx.drawImage(this.canvas, 0, 0, exportCanvas.width, exportCanvas.height);
        
        // Export the scaled canvas
        exportCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to export canvas to blob'));
            }
          },
          'image/png'
        );
      } catch (error) {
        reject(error);
      }
    });
  }
}
