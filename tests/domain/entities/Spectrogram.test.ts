import { describe, it, expect } from 'vitest';
import { Spectrogram } from '@domain/entities/Spectrogram';

describe('Spectrogram', () => {
  it('should create a Spectrogram with valid data', () => {
    const nFreqBins = 1025; // n_fft / 2 + 1 for n_fft=2048
    const nTimeFrames = 10;
    const data = new Float32Array(nFreqBins * nTimeFrames);
    data.fill(0.5);

    const spectrogram = new Spectrogram(
      data,
      nFreqBins,
      nTimeFrames,
      44100,
      2048,
      512
    );

    expect(spectrogram.data).toBe(data);
    expect(spectrogram.nFreqBins).toBe(nFreqBins);
    expect(spectrogram.nTimeFrames).toBe(nTimeFrames);
    expect(spectrogram.sampleRate).toBe(44100);
    expect(spectrogram.nFft).toBe(2048);
    expect(spectrogram.hopLength).toBe(512);
  });

  it('should calculate time duration correctly', () => {
    const nFreqBins = 1025;
    const nTimeFrames = 86; // for 1 second at 44100Hz, hop_length=512
    const data = new Float32Array(nFreqBins * nTimeFrames);
    const spectrogram = new Spectrogram(data, nFreqBins, nTimeFrames, 44100, 2048, 512);

    const expectedDuration = (nTimeFrames - 1) * 512 / 44100;
    expect(spectrogram.duration).toBeCloseTo(expectedDuration, 3);
  });

  it('should calculate frequency resolution correctly', () => {
    const nFreqBins = 1025;
    const nTimeFrames = 10;
    const data = new Float32Array(nFreqBins * nTimeFrames);
    const spectrogram = new Spectrogram(data, nFreqBins, nTimeFrames, 44100, 2048, 512);

    const expectedFreqResolution = 44100 / 2048;
    expect(spectrogram.frequencyResolution).toBeCloseTo(expectedFreqResolution, 3);
  });

  it('should get value at specific frequency and time', () => {
    const nFreqBins = 1025;
    const nTimeFrames = 10;
    const data = new Float32Array(nFreqBins * nTimeFrames);
    data[100 * nTimeFrames + 5] = 0.75; // freq bin 100, time frame 5

    const spectrogram = new Spectrogram(data, nFreqBins, nTimeFrames, 44100, 2048, 512);
    expect(spectrogram.getValue(100, 5)).toBe(0.75);
  });

  it('should return 0 for out of bounds access', () => {
    const nFreqBins = 1025;
    const nTimeFrames = 10;
    const data = new Float32Array(nFreqBins * nTimeFrames);
    const spectrogram = new Spectrogram(data, nFreqBins, nTimeFrames, 44100, 2048, 512);

    expect(spectrogram.getValue(2000, 5)).toBe(0);
    expect(spectrogram.getValue(100, 20)).toBe(0);
  });
});

