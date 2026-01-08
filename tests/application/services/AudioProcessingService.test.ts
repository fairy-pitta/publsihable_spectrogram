import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioProcessingService } from '@application/services/AudioProcessingService';
import { WasmSTFTProcessor } from '@infrastructure/wasm/WasmSTFTProcessor';
import { AudioBuffer } from '@domain/entities/AudioBuffer';
import { STFTParameters } from '@domain/interfaces/ISTFTProcessor';

vi.mock('@infrastructure/wasm/WasmSTFTProcessor');

describe('AudioProcessingService', () => {
  let service: AudioProcessingService;
  let mockProcessor: any;

  beforeEach(async () => {
    mockProcessor = {
      process: vi.fn(),
    };

    (WasmSTFTProcessor.create as any) = vi.fn().mockResolvedValue(mockProcessor);
    service = await AudioProcessingService.create();
  });

  it('should create service instance', async () => {
    expect(service).toBeInstanceOf(AudioProcessingService);
    expect(WasmSTFTProcessor.create).toHaveBeenCalled();
  });

  it('should process audio buffer', async () => {
    const audioBuffer = new AudioBuffer(new Float32Array(44100), 44100);

    const mockSpectrogram = {
      data: new Float32Array(1025 * 86),
      nFreqBins: 1025,
      nTimeFrames: 86,
      sampleRate: 44100,
      nFft: 2048,
      hopLength: 512,
    };

    mockProcessor.process.mockResolvedValue(mockSpectrogram);

    const params: STFTParameters = {
      nFft: 2048,
      hopLength: 512,
      windowType: 'hann',
      magnitudeType: 'magnitude',
      dbMin: -80,
      dbMax: 0,
    };

    const result = await service.processAudio(audioBuffer, params);

    expect(mockProcessor.process).toHaveBeenCalledWith(audioBuffer, params);
    expect(result).toBeDefined();
    expect(result.nFreqBins).toBe(1025);
    expect(result.nTimeFrames).toBe(86);
  });

  it('should cache processor instance', async () => {
    const audioBuffer = new AudioBuffer(new Float32Array(1000), 44100);
    const params: STFTParameters = {
      nFft: 2048,
      hopLength: 512,
      windowType: 'hann',
      magnitudeType: 'magnitude',
      dbMin: -80,
      dbMax: 0,
    };

    await service.processAudio(audioBuffer, params);
    await service.processAudio(audioBuffer, params);

    expect(WasmSTFTProcessor.create).toHaveBeenCalledTimes(1);
  });
});
