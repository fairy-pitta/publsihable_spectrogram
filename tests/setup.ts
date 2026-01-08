import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Install canvas support for jsdom - implement actual Canvas API behavior
// (canvas package causes crashes in test environment, so we implement a working mock)
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  
  HTMLCanvasElement.prototype.getContext = function(type: string, ...args: any[]) {
    if (type === '2d') {
      // Store image data to simulate actual canvas behavior
      const canvasElement = this;
      const width = canvasElement.width || 800;
      const height = canvasElement.height || 600;
      let imageDataStore: Uint8ClampedArray = new Uint8ClampedArray(width * height * 4);
      
      // Implement actual Canvas 2D context behavior
      const ctx = {
        canvas: canvasElement,
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
        font: '10px sans-serif',
        textAlign: 'left' as CanvasTextAlign,
        textBaseline: 'alphabetic' as CanvasTextBaseline,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'low' as ImageSmoothingQuality,
        
        clearRect: (x: number, y: number, w: number, h: number) => {
          // Clear the specified area
          for (let py = Math.max(0, y); py < Math.min(height, y + h); py++) {
            for (let px = Math.max(0, x); px < Math.min(width, x + w); px++) {
              const index = (py * width + px) * 4;
              imageDataStore[index] = 0;     // R
              imageDataStore[index + 1] = 0; // G
              imageDataStore[index + 2] = 0; // B
              imageDataStore[index + 3] = 0; // A (transparent)
            }
          }
        },
        
        fillRect: (x: number, y: number, w: number, h: number) => {
          // Fill rectangle with current fillStyle
          const color = this.fillStyle || '#000000';
          const rgb = color.match(/\d+/g) || [0, 0, 0];
          const r = parseInt(rgb[0]) || 0;
          const g = parseInt(rgb[1]) || 0;
          const b = parseInt(rgb[2]) || 0;
          
          for (let py = Math.max(0, y); py < Math.min(height, y + h); py++) {
            for (let px = Math.max(0, x); px < Math.min(width, x + w); px++) {
              const index = (py * width + px) * 4;
              imageDataStore[index] = r;
              imageDataStore[index + 1] = g;
              imageDataStore[index + 2] = b;
              imageDataStore[index + 3] = 255;
            }
          }
        },
        
        strokeRect: (x: number, y: number, w: number, h: number) => {
          // Draw rectangle outline
          this.strokeStyle = this.strokeStyle || '#000000';
        },
        
        beginPath: () => {
          // Start a new path
        },
        
        moveTo: (x: number, y: number) => {
          // Move to point
        },
        
        lineTo: (x: number, y: number) => {
          // Draw line to point
        },
        
        stroke: () => {
          // Stroke the path
        },
        
        fillText: (text: string, x: number, y: number) => {
          // Draw text (simplified - just mark that text was drawn)
        },

        drawImage: (..._args: any[]) => {
          // No-op for tests; enough for export paths that rely on drawImage.
        },
        
        createImageData: (widthOrImageData: number | ImageData, height?: number): ImageData => {
          let w: number;
          let h: number;
          
          if (typeof widthOrImageData === 'number') {
            w = widthOrImageData;
            h = height || widthOrImageData;
          } else {
            w = widthOrImageData.width;
            h = widthOrImageData.height;
          }
          
          return {
            data: new Uint8ClampedArray(w * h * 4),
            width: w,
            height: h,
          };
        },
        
        putImageData: (imageData: ImageData, dx: number, dy: number) => {
          // Actually store the image data
          const srcWidth = imageData.width;
          const srcHeight = imageData.height;
          
          for (let sy = 0; sy < srcHeight; sy++) {
            for (let sx = 0; sx < srcWidth; sx++) {
              const tx = dx + sx;
              const ty = dy + sy;
              
              if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
                const srcIndex = (sy * srcWidth + sx) * 4;
                const dstIndex = (ty * width + tx) * 4;
                
                imageDataStore[dstIndex] = imageData.data[srcIndex];
                imageDataStore[dstIndex + 1] = imageData.data[srcIndex + 1];
                imageDataStore[dstIndex + 2] = imageData.data[srcIndex + 2];
                imageDataStore[dstIndex + 3] = imageData.data[srcIndex + 3];
              }
            }
          }
        },
        
        getImageData: (sx: number, sy: number, sw: number, sh: number): ImageData => {
          // Return actual stored image data
          const data = new Uint8ClampedArray(sw * sh * 4);
          
          for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
              const srcX = sx + x;
              const srcY = sy + y;
              
              if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                const srcIndex = (srcY * width + srcX) * 4;
                const dstIndex = (y * sw + x) * 4;
                
                data[dstIndex] = imageDataStore[srcIndex];
                data[dstIndex + 1] = imageDataStore[srcIndex + 1];
                data[dstIndex + 2] = imageDataStore[srcIndex + 2];
                data[dstIndex + 3] = imageDataStore[srcIndex + 3];
              }
            }
          }
          
          return {
            data,
            width: sw,
            height: sh,
          };
        },
      };
      
      return ctx as any;
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