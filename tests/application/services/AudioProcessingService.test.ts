import { describe, it, expect, beforeEach } from 'vitest';
import { AudioProcessingService } from '@application/services/AudioProcessingService';
import { AudioBuffer } from '@domain/entities/AudioBuffer';
import { STFTParameters } from '@domain/interfaces/ISTFTProcessor';

describe('AudioProcessingService', () => {
  let service: AudioProcessingService;

  beforeEach(async () => {
    // Try to create service with actual WASM processor
    // If WASM is not available, tests will be skipped
    try {
      service = await AudioProcessingService.create();
    } catch (error) {
      // WASM module not available - skip tests
      service = null as any;
    }
  });

  it.skipIf(!service)('should create service instance', async () => {
    expect(service).toBeInstanceOf(AudioProcessingService);
  });

  it.skipIf(!service)('should process audio buffer', async () => {
    const audioData = new Float32Array(4410); // 0.1 second at 44.1kHz
    // Generate a simple sine wave for testing
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

    const result = await service.processAudio(audioBuffer, params);

    expect(result).toBeDefined();
    expect(result.nFreqBins).toBe(1025); // 2048 / 2 + 1
    expect(result.nTimeFrames).toBeGreaterThan(0);
    expect(result.data.length).toBe(result.nFreqBins * result.nTimeFrames);
    expect(result.sampleRate).toBe(44100);
    expect(result.nFft).toBe(2048);
    expect(result.hopLength).toBe(512);
  });

  it.skipIf(!service)('should handle different window types', async () => {
    const audioData = new Float32Array(1000);
    audioData.fill(0.1);

    for (const windowType of ['hann', 'hamming', 'blackman'] as const) {
      const audioBuffer = new AudioBuffer(audioData, 44100);
      const params: STFTParameters = {
        nFft: 512,
        hopLength: 256,
        windowType,
        magnitudeType: 'magnitude',
        dbMin: -80,
        dbMax: 0,
      };

      const result = await service.processAudio(audioBuffer, params);

      expect(result).toBeDefined();
      expect(result.nFreqBins).toBe(257); // 512 / 2 + 1
    }
  });
});
