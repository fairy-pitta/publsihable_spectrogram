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

    // With contrast 0.5 (less than 1), the color should be closer to 0.5 (less contrast)
    // With contrast 2.0 (greater than 1), the color should be further from 0.5 (more contrast)
    // For 0.5 input with contrast 0.5, result should be 0.5 (no change at midpoint)
    // For 0.5 input with contrast 2.0, result should still be 0.5 (no change at midpoint)
    // Let's test with a non-midpoint value
    const color3 = Colormap.applyContrast([0.8, 0.8, 0.8], 0.5);
    const color4 = Colormap.applyContrast([0.8, 0.8, 0.8], 2.0);

    // Lower contrast should bring values closer to 0.5
    expect(color3[0]).toBeLessThan(0.8);
    expect(color3[0]).toBeGreaterThan(0.5);
    // Higher contrast should push values further from 0.5
    expect(color4[0]).toBeGreaterThan(0.8);
  });

  it('should apply gamma correction', () => {
    // Gamma < 1 makes values brighter (higher)
    // Gamma > 1 makes values darker (lower)
    const color1 = Colormap.applyGamma([0.5, 0.5, 0.5], 0.5);
    const color2 = Colormap.applyGamma([0.5, 0.5, 0.5], 2.0);

    // Gamma 0.5 means invGamma = 2, so 0.5^2 = 0.25 (darker, not brighter)
    // Gamma 2.0 means invGamma = 0.5, so 0.5^0.5 ≈ 0.707 (brighter)
    expect(color1[0]).toBeLessThan(0.5); // 0.5^2 = 0.25
    expect(color2[0]).toBeGreaterThan(0.5); // 0.5^0.5 ≈ 0.707
  });
});
