import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Install canvas support for jsdom - use mock implementation only
// (canvas package causes crashes in test environment, so we always use mocks)
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  
  HTMLCanvasElement.prototype.getContext = function(type: string, ...args: any[]) {
    if (type === '2d') {
      // Always use mock implementation to avoid canvas package crashes
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
          data: new Uint8ClampedArray((this.width || 800) * (this.height || 600) * 4),
          width: this.width || 800,
          height: this.height || 600,
        }),
      };
      return mockCtx as any;
    }
    if (originalGetContext) {
      return originalGetContext.call(this, type, ...args);
    }
    return null;
  };
  
  // Polyfill toBlob and toDataURL for HTMLCanvasElement
  // Override jsdom's not-implemented versions
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value: function(
      callback: (blob: Blob | null) => void,
      type?: string,
      quality?: number
    ) {
      // Use Promise.resolve().then to make it async like the real implementation
      // but execute immediately in the same tick
      Promise.resolve().then(() => {
        const blob = new Blob([''], { type: type || 'image/png' });
        callback(blob);
      });
    },
    writable: true,
    configurable: true,
  });
  
  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    value: function(type?: string, quality?: number): string {
      // Return a minimal data URL (1x1 transparent PNG)
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    },
    writable: true,
    configurable: true,
  });
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
});