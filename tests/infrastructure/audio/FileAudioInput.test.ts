import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileAudioInput } from '@infrastructure/audio/FileAudioInput';
import { AudioBuffer } from '@domain/entities/AudioBuffer';

// Mock File API
global.File = vi.fn().mockImplementation((bits, name, options) => ({
  name: name || 'test.wav',
  size: bits.length,
  type: options?.type || 'audio/wav',
  arrayBuffer: async () => new ArrayBuffer(0),
  stream: () => new ReadableStream(),
  text: async () => '',
  slice: () => new Blob(),
  ...options,
})) as any;

describe('FileAudioInput', () => {
  let fileInput: FileAudioInput;
  let mockAudioContext: any;
  let mockDecodeAudioData: any;

  beforeEach(() => {
    mockDecodeAudioData = vi.fn();
    mockAudioContext = {
      decodeAudioData: mockDecodeAudioData,
      sampleRate: 44100,
    };

    global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext) as any;
    global.OfflineAudioContext = vi.fn().mockImplementation(() => mockAudioContext) as any;

    fileInput = new FileAudioInput();
  });

  it('should create FileAudioInput instance', () => {
    expect(fileInput).toBeInstanceOf(FileAudioInput);
  });

  it('should check if File API is supported', () => {
    const isSupported = fileInput.isSupported();
    expect(isSupported).toBe(true);
  });

  it('should load audio from File', async () => {
    const mockAudioBuffer = {
      getChannelData: (channel: number) => {
        if (channel === 0) {
          return new Float32Array([0.1, 0.2, 0.3, 0.4]);
        }
        return new Float32Array(4);
      },
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 4,
      duration: 4 / 44100,
    };

    mockDecodeAudioData.mockResolvedValue(mockAudioBuffer);

    const file = new File([''], 'test.wav', { type: 'audio/wav' });
    fileInput.setFile(file);

    const buffer = await fileInput.loadAudio();

    expect(buffer).toBeInstanceOf(AudioBuffer);
    expect(buffer.sampleRate).toBe(44100);
    expect(buffer.length).toBe(4);
    expect(mockDecodeAudioData).toHaveBeenCalled();
  });

  it('should convert stereo to mono', async () => {
    const mockAudioBuffer = {
      getChannelData: (channel: number) => {
        if (channel === 0) {
          return new Float32Array([0.1, 0.2]);
        }
        return new Float32Array([0.3, 0.4]);
      },
      numberOfChannels: 2,
      sampleRate: 44100,
      length: 2,
      duration: 2 / 44100,
    };

    mockDecodeAudioData.mockResolvedValue(mockAudioBuffer);

    const file = new File([''], 'test.wav', { type: 'audio/wav' });
    fileInput.setFile(file);

    const buffer = await fileInput.loadAudio();

    expect(buffer).toBeInstanceOf(AudioBuffer);
    expect(buffer.length).toBe(2);
    // Stereo to mono: average of two channels
    expect(buffer.samples[0]).toBeCloseTo(0.2, 5); // (0.1 + 0.3) / 2
    expect(buffer.samples[1]).toBeCloseTo(0.3, 5); // (0.2 + 0.4) / 2
  });

  it('should handle decode errors', async () => {
    mockDecodeAudioData.mockRejectedValue(new Error('Decode failed'));

    const file = new File([''], 'test.wav', { type: 'audio/wav' });
    fileInput.setFile(file);

    await expect(fileInput.loadAudio()).rejects.toThrow();
  });
});
