import { describe, it, expect } from 'vitest';
import { Colormap } from '@infrastructure/renderer/Colormap';

describe('Colormap', () => {
  it('should generate viridis colormap', () => {
    const color = Colormap.viridis(0.0);
    expect(color).toHaveLength(3);
    expect(color[0]).toBeGreaterThanOrEqual(0);
    expect(color[1]).toBeGreaterThanOrEqual(0);
    expect(color[2]).toBeGreaterThanOrEqual(0);
    expect(color[0]).toBeLessThanOrEqual(1);
    expect(color[1]).toBeLessThanOrEqual(1);
    expect(color[2]).toBeLessThanOrEqual(1);
  });

  it('should generate magma colormap', () => {
    const color = Colormap.magma(0.5);
    expect(color).toHaveLength(3);
    expect(color.every((c) => c >= 0 && c <= 1)).toBe(true);
  });

  it('should generate grayscale colormap', () => {
    const color = Colormap.grayscale(0.8);
    expect(color).toHaveLength(3);
    expect(color[0]).toBe(color[1]);
    expect(color[1]).toBe(color[2]);
    expect(color[0]).toBeCloseTo(0.8, 5);
  });

  it('should clamp values to [0, 1]', () => {
    const color1 = Colormap.viridis(-0.1);
    const color2 = Colormap.viridis(1.5);

    expect(color1.every((c) => c >= 0 && c <= 1)).toBe(true);
    expect(color2.every((c) => c >= 0 && c <= 1)).toBe(true);
  });

  it('should apply brightness adjustment', () => {
    const color1 = Colormap.applyBrightness([0.5, 0.5, 0.5], 0.5);
    const color2 = Colormap.applyBrightness([0.5, 0.5, 0.5], 1.5);

    expect(color1.every((c) => c < 0.5)).toBe(true);
    expect(color2.every((c) => c > 0.5 && c <= 1.0)).toBe(true);
  });

  it('should apply contrast adjustment', () => {
    const color1 = Colormap.applyContrast([0.5, 0.5, 0.5], 0.5);
    const color2 = Colormap.applyContrast([0.5, 0.5, 0.5], 2.0);

    expect(color1[0]).toBeLessThan(0.5);
    expect(color2[0]).toBeGreaterThan(0.5);
  });

  it('should apply gamma correction', () => {
    const color1 = Colormap.applyGamma([0.5, 0.5, 0.5], 0.5);
    const color2 = Colormap.applyGamma([0.5, 0.5, 0.5], 2.0);

    expect(color1[0]).toBeGreaterThan(0.5);
    expect(color2[0]).toBeLessThan(0.5);
  });
});
