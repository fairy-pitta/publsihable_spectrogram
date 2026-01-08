import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Install canvas support for jsdom - must be done synchronously at module load time
// Use a simple mock implementation if canvas package is not available
let canvasModule: any = null;
let useCanvasModule = false;

// Try to load canvas module once at setup time
try {
  canvasModule = require('canvas');
  useCanvasModule = true;
} catch (e) {
  // canvas package not available or not properly built, will use mock
  useCanvasModule = false;
}

if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  
  HTMLCanvasElement.prototype.getContext = function(type: string, ...args: any[]) {
    if (type === '2d') {
      if (useCanvasModule && canvasModule) {
        try {
          const width = this.width || 800;
          const height = this.height || 600;
          const nodeCanvas = canvasModule.createCanvas(width, height);
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
          // Fall through to mock
        }
      }
      
      // Use mock implementation
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
