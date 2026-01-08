export type ColormapType = 'viridis' | 'magma' | 'grayscale';

export class Colormap {
  static viridis(t: number): [number, number, number] {
    return Colormap.viridisImproved(t);
  }

  static magma(t: number): [number, number, number] {
    t = Math.max(0, Math.min(1, t));
    // Simplified magma colormap approximation
    const r = Math.min(1.0, 0.5 + t * 1.2);
    const g = Math.min(1.0, t * 0.8);
    const b = Math.min(1.0, 0.2 + t * 0.6);
    return [r, g, b];
  }

  static grayscale(t: number): [number, number, number] {
    t = Math.max(0, Math.min(1, t));
    return [t, t, t];
  }

  static getColormap(type: ColormapType): (t: number) => [number, number, number] {
    switch (type) {
      case 'viridis':
        return this.viridis;
      case 'magma':
        return this.magma;
      case 'grayscale':
        return this.grayscale;
      default:
        return this.viridis;
    }
  }

  static applyBrightness(color: [number, number, number], brightness: number): [number, number, number] {
    return [
      Math.max(0, Math.min(1, color[0] * brightness)),
      Math.max(0, Math.min(1, color[1] * brightness)),
      Math.max(0, Math.min(1, color[2] * brightness)),
    ];
  }

  static applyContrast(color: [number, number, number], contrast: number): [number, number, number] {
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
    return [
      Math.max(0, Math.min(1, (factor * (color[0] - 0.5) + 0.5))),
      Math.max(0, Math.min(1, (factor * (color[1] - 0.5) + 0.5))),
      Math.max(0, Math.min(1, (factor * (color[2] - 0.5) + 0.5))),
    ];
  }

  static applyGamma(color: [number, number, number], gamma: number): [number, number, number] {
    const invGamma = 1.0 / gamma;
    return [
      Math.pow(color[0], invGamma),
      Math.pow(color[1], invGamma),
      Math.pow(color[2], invGamma),
    ];
  }

  static valueToColor(
    value: number,
    min: number,
    max: number,
    colormap: ColormapType,
    brightness: number = 1.0,
    contrast: number = 1.0,
    gamma: number = 1.0
  ): [number, number, number] {
    const normalized = (value - min) / (max - min || 1);
    const clamped = Math.max(0, Math.min(1, normalized));
    const colormapFunc = this.getColormap(colormap);
    let rgb = colormapFunc(clamped);

    if (brightness !== 1.0) {
      rgb = this.applyBrightness(rgb, brightness);
    }
    if (contrast !== 1.0) {
      rgb = this.applyContrast(rgb, contrast);
    }
    if (gamma !== 1.0) {
      rgb = this.applyGamma(rgb, gamma);
    }

    return rgb;
  }

  // Improved viridis colormap implementation
  static viridisImproved(t: number): [number, number, number] {
    t = Math.max(0, Math.min(1, t));
    const r0 = 0.267004;
    const r1 = 0.004874;
    const r2 = 0.329415;
    const r3 = 0.206453;
    const r4 = 0.993248;
    const r5 = 0.995955;

    const g0 = 0.004874;
    const g1 = 0.324426;
    const g2 = 0.677123;
    const g3 = 0.986078;
    const g4 = 0.852007;
    const g5 = 0.695717;

    const b0 = 0.329415;
    const b1 = 0.361816;
    const b2 = 0.656353;
    const b3 = 0.129171;
    const b4 = 0.270896;
    const b5 = 0.285637;

    if (t < 0.2) {
      const u = t / 0.2;
      return [
        r0 + u * (r1 - r0),
        g0 + u * (g1 - g0),
        b0 + u * (b1 - b0),
      ];
    } else if (t < 0.4) {
      const u = (t - 0.2) / 0.2;
      return [
        r1 + u * (r2 - r1),
        g1 + u * (g2 - g1),
        b1 + u * (b2 - b1),
      ];
    } else if (t < 0.6) {
      const u = (t - 0.4) / 0.2;
      return [
        r2 + u * (r3 - r2),
        g2 + u * (g3 - g2),
        b2 + u * (b3 - b2),
      ];
    } else if (t < 0.8) {
      const u = (t - 0.6) / 0.2;
      return [
        r3 + u * (r4 - r3),
        g3 + u * (g4 - g3),
        b3 + u * (b4 - b3),
      ];
    } else {
      const u = (t - 0.8) / 0.2;
      return [
        r4 + u * (r5 - r4),
        g4 + u * (g5 - g4),
        b4 + u * (b5 - b4),
      ];
    }
  }
}
