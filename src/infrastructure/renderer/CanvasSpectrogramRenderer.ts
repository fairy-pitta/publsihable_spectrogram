import { IRenderer, RenderOptions } from '@domain/interfaces/IRenderer';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { Annotation } from '@domain/entities/Annotation';
import { Colormap } from './Colormap';

export class CanvasSpectrogramRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private annotations: Map<string, Annotation> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.context = ctx;
  }

  render(spectrogram: Spectrogram, options: RenderOptions): void {
    const ctx = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate rendering area (leave space for axes and colorbar)
    const marginLeft = options.showAxes ? 60 : 0;
    const marginBottom = options.showAxes ? 40 : 0;
    const marginRight = options.showColorbar ? 80 : 0;
    const marginTop = 20;

    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;
    const plotX = marginLeft;
    const plotY = marginTop;

    // Render spectrogram
    const imageData = ctx.createImageData(plotWidth, plotHeight);
    const { data } = imageData;

    const minDb = options.dbMin;
    const maxDb = options.dbMax;
    const dbRange = maxDb - minDb;

    for (let y = 0; y < plotHeight; y++) {
      for (let x = 0; x < plotWidth; x++) {
        const freqBin = Math.floor((y / plotHeight) * spectrogram.nFreqBins);
        const timeFrame = Math.floor((x / plotWidth) * spectrogram.nTimeFrames);

        if (freqBin >= 0 && freqBin < spectrogram.nFreqBins &&
            timeFrame >= 0 && timeFrame < spectrogram.nTimeFrames) {
          const dbValue = spectrogram.getValue(freqBin, timeFrame);
          const normalized = (dbValue - minDb) / dbRange;
          
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
        this.canvas.toBlob(
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
