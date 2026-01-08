import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Install canvas support for jsdom - must be done synchronously at module load time
// Use a simple mock implementation if canvas package is not available
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  
  HTMLCanvasElement.prototype.getContext = function(type: string, ...args: any[]) {
    if (type === '2d') {
      try {
        const { createCanvas } = require('canvas');
        const width = this.width || 800;
        const height = this.height || 600;
        const nodeCanvas = createCanvas(width, height);
        const ctx = nodeCanvas.getContext('2d');
        // Make ctx.canvas point back to the HTMLCanvasElement
        Object.defineProperty(ctx, 'canvas', {
          get: () => this,
          configurable: true,
        });
        // Add missing methods that might be needed
        if (!ctx.createImageData) {
          ctx.createImageData = nodeCanvas.createImageData.bind(nodeCanvas);
        }
        if (!ctx.putImageData) {
          ctx.putImageData = nodeCanvas.putImageData.bind(nodeCanvas);
        }
        return ctx as any;
      } catch (e) {
        // canvas package not available or not properly built, use mock
        const mockCtx = {
          canvas: this,
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 1,
          font: '',
          textAlign: 'left',
          textBaseline: 'alphabetic',
          clearRect: () => {},
          fillRect: () => {},
          strokeRect: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          fillText: () => {},
          createImageData: (width: number, height: number) => ({
            data: new Uint8ClampedArray(width * height * 4),
            width,
            height,
          }),
          putImageData: () => {},
          getImageData: () => ({
            data: new Uint8ClampedArray(800 * 600 * 4),
            width: 800,
            height: 600,
          }),
          toBlob: (callback: (blob: Blob | null) => void) => {
            callback(new Blob([''], { type: 'image/png' }));
          },
        };
        return mockCtx as any;
      }
    }
    if (originalGetContext) {
      return originalGetContext.call(this, type, ...args);
    }
    return null;
  };
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
