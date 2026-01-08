import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Install canvas support for jsdom
try {
  const { createCanvas } = require('canvas');
  
  // Polyfill HTMLCanvasElement.getContext for jsdom
  if (typeof HTMLCanvasElement !== 'undefined') {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type: string, ...args: any[]) {
      if (type === '2d') {
        const width = this.width || 800;
        const height = this.height || 600;
        const nodeCanvas = createCanvas(width, height);
        const ctx = nodeCanvas.getContext('2d');
        // Make ctx.canvas point back to the HTMLCanvasElement
        Object.defineProperty(ctx, 'canvas', {
          get: () => this,
          configurable: true,
        });
        return ctx as any;
      }
      if (originalGetContext) {
        return originalGetContext.call(this, type, ...args);
      }
      return null;
    };
  }
} catch (e) {
  // canvas package not available, tests will fail
  console.warn('canvas package not available, Canvas tests may fail');
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
