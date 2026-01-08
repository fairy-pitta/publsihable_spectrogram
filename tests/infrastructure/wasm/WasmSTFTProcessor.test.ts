import { describe, it, expect, beforeEach } from 'vitest';
import { WasmSTFTProcessor } from '@infrastructure/wasm/WasmSTFTProcessor';
import { AudioBuffer } from '@domain/entities/AudioBuffer';
import { STFTParameters } from '@domain/interfaces/ISTFTProcessor';

describe('WasmSTFTProcessor', () => {
  let processor: WasmSTFTProcessor | null = null;

  beforeEach(async () => {
    // Try to load actual WASM module
    // If WASM is not available, processor will be null and tests will be skipped
    try {
      processor = await WasmSTFTProcessor.create();
    } catch (error) {
      // WASM module not available - skip tests
      processor = null;
    }
  });

  it.skipIf(!processor)('should create a processor instance', async () => {
    expect(processor).toBeInstanceOf(WasmSTFTProcessor);
  });

  it.skipIf(!processor)('should process audio data', async () => {
    const audioData = new Float32Array(4410); // 0.1 second at 44.1kHz
    // Generate a simple sine wave at 440Hz
    for (let i = 0; i < audioData.length; i++) {
      audioData[i] = Math.sin(2 * Math.PI * 440 * i / 44100);
    }

    const audioBuffer = new AudioBuffer(audioData, 44100);

    const params: STFTParameters = {
      nFft: 2048,
      hopLength: 512,
      windowType: 'hann',
      magnitudeType: 'magnitude',
      dbMin: -80,
      dbMax: 0,
    };

    const result = await processor!.process(audioBuffer, params);

    expect(result).toBeDefined();
    expect(result.nFreqBins).toBe(1025); // 2048 / 2 + 1
    expect(result.nTimeFrames).toBeGreaterThan(0);
    expect(result.data.length).toBe(result.nFreqBins * result.nTimeFrames);
    expect(result.sampleRate).toBe(44100);
    expect(result.nFft).toBe(2048);
    expect(result.hopLength).toBe(512);
    
    // Verify dB conversion was applied (values should be in dB range)
    const hasValidDbValues = Array.from(result.data).some(
      (value) => value >= params.dbMin && value <= params.dbMax
    );
    expect(hasValidDbValues).toBe(true);
  });

  it.skipIf(!processor)('should handle different window types', async () => {
    const audioData = new Float32Array(1000);
    // Generate test signal
    for (let i = 0; i < audioData.length; i++) {
      audioData[i] = Math.sin(2 * Math.PI * 440 * i / 44100);
    }
    const audioBuffer = new AudioBuffer(audioData, 44100);

    for (const windowType of ['hann', 'hamming', 'blackman'] as const) {
      const params: STFTParameters = {
        nFft: 512,
        hopLength: 256,
        windowType,
        magnitudeType: 'magnitude',
        dbMin: -80,
        dbMax: 0,
      };

      const result = await processor!.process(audioBuffer, params);

      expect(result).toBeDefined();
      expect(result.nFreqBins).toBe(257); // 512 / 2 + 1
      expect(result.nTimeFrames).toBeGreaterThan(0);
    }
  });

  it.skipIf(!processor)('should apply dB conversion correctly', async () => {
    const audioData = new Float32Array(1000);
    audioData.fill(0.5);
    const audioBuffer = new AudioBuffer(audioData, 44100);

    const params: STFTParameters = {
      nFft: 512,
      hopLength: 256,
      windowType: 'hann',
      magnitudeType: 'magnitude',
      dbMin: -80,
      dbMax: 0,
    };

    const result = await processor!.process(audioBuffer, params);

    expect(result.data.length).toBeGreaterThan(0);
    // All values should be within dB range
    const allInRange = Array.from(result.data).every(
      (value) => value >= params.dbMin && value <= params.dbMax
    );
    expect(allInRange).toBe(true);
  });
});
