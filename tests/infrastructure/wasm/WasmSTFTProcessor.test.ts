import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WasmSTFTProcessor } from '@infrastructure/wasm/WasmSTFTProcessor';

// Mock WASM module
vi.mock('@infrastructure/wasm/pkg/spectrogram_wasm', () => ({
  default: async () => ({
    STFTProcessor: class {
      constructor(
        public nFft: number,
        public hopLength: number,
        public windowType: string
      ) {}
      process(audioData: Float32Array, sampleRate: number): Float32Array {
        const nFreqBins = Math.floor(this.nFft / 2) + 1;
        const nFrames = Math.ceil(audioData.length / this.hopLength);
        const result = new Float32Array(nFreqBins * nFrames);
        result.fill(0.5);
        return result;
      }
      to_db(
        magnitudeSpectrum: Float32Array,
        minDb: number,
        maxDb: number
      ): Float32Array {
        return new Float32Array(magnitudeSpectrum.length).fill(minDb + 10);
      }
    },
    NoiseReducer: class {
      estimate_noise(_noiseSegment: Float32Array): void {}
      reduce_noise(
        magnitudeSpectrum: Float32Array,
        _alpha: number,
        _beta: number
      ): Float32Array {
        return magnitudeSpectrum;
      }
    },
    compute_mel_filter_bank(
      nMels: number,
      nFft: number,
      _sampleRate: number,
      _fmin: number,
      _fmax: number
    ): Float32Array {
      const nBins = Math.floor(nFft / 2) + 1;
      // Return flattened array: [filter0[0..nBins], filter1[0..nBins], ...]
      const result = new Float32Array(nMels * nBins);
      result.fill(0.1);
      return result;
    },
  }),
}));

describe('WasmSTFTProcessor', () => {
  let processor: WasmSTFTProcessor;

  beforeEach(async () => {
    processor = await WasmSTFTProcessor.create();
  });

  it('should create a processor instance', async () => {
    expect(processor).toBeInstanceOf(WasmSTFTProcessor);
  });

  it('should process audio data', async () => {
    const audioData = new Float32Array(44100); // 1 second at 44.1kHz
    audioData.fill(0.5);

    const params = {
      nFft: 2048,
      hopLength: 512,
      windowType: 'hann' as const,
      magnitudeType: 'magnitude' as const,
      dbMin: -80,
      dbMax: 0,
    };

    const result = await processor.process(
      { samples: audioData, sampleRate: 44100 },
      params
    );

    expect(result).toBeDefined();
    expect(result.nFreqBins).toBe(1025); // 2048 / 2 + 1
    expect(result.nTimeFrames).toBeGreaterThan(0);
    expect(result.data.length).toBe(result.nFreqBins * result.nTimeFrames);
  });

  it('should handle different window types', async () => {
    const audioData = new Float32Array(1000);

    for (const windowType of ['hann', 'hamming', 'blackman'] as const) {
      const params = {
        nFft: 512,
        hopLength: 256,
        windowType,
        magnitudeType: 'magnitude' as const,
        dbMin: -80,
        dbMax: 0,
      };

      const result = await processor.process(
        { samples: audioData, sampleRate: 44100 },
        params
      );

      expect(result).toBeDefined();
      expect(result.nFreqBins).toBe(257); // 512 / 2 + 1
    }
  });

  it('should apply dB conversion', async () => {
    const audioData = new Float32Array(1000);
    audioData.fill(0.5);

    const params = {
      nFft: 512,
      hopLength: 256,
      windowType: 'hann' as const,
      magnitudeType: 'magnitude' as const,
      dbMin: -80,
      dbMax: 0,
    };

    const result = await processor.process(
      { samples: audioData, sampleRate: 44100 },
      params
    );

    expect(result.data.length).toBeGreaterThan(0);
  });
});
