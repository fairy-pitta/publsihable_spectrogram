import { IRenderer } from '@domain/interfaces/IRenderer';
import { IAnnotationLayer } from '@domain/interfaces/IAnnotationLayer';

export class ExportService {
  constructor(
    private renderer: IRenderer,
    private annotationLayer: IAnnotationLayer
  ) {}

  async exportToPNG(dpi: number = 300): Promise<Blob> {
    return this.renderer.exportToPNG(dpi);
  }

  exportToSVG(): string {
    const svgString = this.annotationLayer.getSVGString();
    
    // Include canvas as image in SVG if needed
    const canvas = this.renderer.getCanvas();
    if (canvas) {
      const canvasDataUrl = canvas.toDataURL('image/png');
      const svg = this.annotationLayer.getSVG();
      if (!svg) {
        return svgString;
      }
      
      // Create a new SVG that includes the canvas image and annotations
      const combinedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      combinedSvg.setAttribute('width', canvas.width.toString());
      combinedSvg.setAttribute('height', canvas.height.toString());
      combinedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Add canvas as image
      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      image.setAttribute('href', canvasDataUrl);
      image.setAttribute('width', canvas.width.toString());
      image.setAttribute('height', canvas.height.toString());
      combinedSvg.appendChild(image);

      // Add annotations
      const annotationSVG = svg.cloneNode(true) as SVGSVGElement;
      combinedSvg.appendChild(annotationSVG);

      return new XMLSerializer().serializeToString(combinedSvg);
    }

    return svgString;
  }

  async downloadPNG(filename: string = 'spectrogram.png', dpi: number = 300): Promise<void> {
    const blob = await this.exportToPNG(dpi);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  downloadSVG(filename: string = 'spectrogram.svg'): void {
    const svgString = this.exportToSVG();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

