import { describe, it, expect } from 'vitest';
import { AudioBuffer } from '@domain/entities/AudioBuffer';

describe('AudioBuffer', () => {
  it('should create an AudioBuffer with valid data', () => {
    const samples = new Float32Array([0.1, 0.2, 0.3, 0.4]);
    const sampleRate = 44100;
    const buffer = new AudioBuffer(samples, sampleRate);

    expect(buffer.samples).toBe(samples);
    expect(buffer.sampleRate).toBe(sampleRate);
    expect(buffer.duration).toBe(samples.length / sampleRate);
  });

  it('should calculate duration correctly', () => {
    const samples = new Float32Array(88200); // 2 seconds at 44100 Hz
    const buffer = new AudioBuffer(samples, 44100);
    expect(buffer.duration).toBeCloseTo(2.0, 5);
  });

  it('should provide length property', () => {
    const samples = new Float32Array([1, 2, 3, 4, 5]);
    const buffer = new AudioBuffer(samples, 44100);
    expect(buffer.length).toBe(5);
  });

  it('should handle empty buffer', () => {
    const samples = new Float32Array(0);
    const buffer = new AudioBuffer(samples, 44100);
    expect(buffer.length).toBe(0);
    expect(buffer.duration).toBe(0);
  });
});
