import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MicrophoneAudioInput } from '@infrastructure/audio/MicrophoneAudioInput';
import { AudioBuffer } from '@domain/entities/AudioBuffer';

describe('MicrophoneAudioInput', () => {
  let micInput: MicrophoneAudioInput;
  let mockMediaStream: any;
  let mockAudioContext: any;
  let mockMediaStreamSource: any;
  let mockScriptProcessor: any;
  let mockGetUserMedia: any;

  beforeEach(() => {
    mockScriptProcessor = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      onaudioprocess: null,
    };

    mockMediaStreamSource = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockMediaStream = {
      getTracks: () => [{ stop: vi.fn() }],
    };

    mockGetUserMedia = vi.fn().mockResolvedValue(mockMediaStream);

    mockAudioContext = {
      createMediaStreamSource: vi.fn().mockReturnValue(mockMediaStreamSource),
      createScriptProcessor: vi.fn().mockReturnValue(mockScriptProcessor),
      sampleRate: 44100,
      state: 'running',
      close: vi.fn().mockResolvedValue(undefined),
      destination: {},
    };

    global.navigator = {
      mediaDevices: {
        getUserMedia: mockGetUserMedia,
      },
    } as any;

    global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext) as any;

    micInput = new MicrophoneAudioInput();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create MicrophoneAudioInput instance', () => {
    expect(micInput).toBeInstanceOf(MicrophoneAudioInput);
  });

  it('should check if microphone API is supported', () => {
    const isSupported = micInput.isSupported();
    expect(isSupported).toBe(true);
  });

  it('should start microphone input', async () => {
    await micInput.start();

    expect(mockGetUserMedia).toHaveBeenCalled();
    expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockMediaStream);
    expect(mockMediaStreamSource.connect).toHaveBeenCalledWith(mockScriptProcessor);
    expect(mockScriptProcessor.connect).toHaveBeenCalledWith(mockAudioContext.destination);
  });

  it('should stop microphone input', async () => {
    await micInput.start();
    micInput.stop();

    expect(mockMediaStreamSource.disconnect).toHaveBeenCalled();
    expect(mockScriptProcessor.disconnect).toHaveBeenCalled();
  });

  it('should call audio data callback', async () => {
    const callback = vi.fn();
    micInput.onAudioData(callback);

    await micInput.start();

    // Simulate audio data
    const mockAudioBuffer = {
      getChannelData: (channel: number) => {
        if (channel === 0) {
          return new Float32Array([0.1, 0.2, 0.3]);
        }
        return new Float32Array(3);
      },
      numberOfChannels: 1,
    };

    const mockEvent = {
      inputBuffer: mockAudioBuffer,
    };

    if (mockScriptProcessor.onaudioprocess) {
      mockScriptProcessor.onaudioprocess(mockEvent);
    }

    expect(callback).toHaveBeenCalled();
    const calledWith = callback.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(AudioBuffer);
    expect(calledWith.sampleRate).toBe(44100);
  });

  it('should handle getUserMedia errors', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

    await expect(micInput.start()).rejects.toThrow();
  });

  it('should remove audio data listener', async () => {
    const callback = vi.fn();
    micInput.onAudioData(callback);
    micInput.removeAudioDataListener(callback);

    await micInput.start();

    const mockAudioBuffer = {
      getChannelData: () => new Float32Array([0.1]),
      numberOfChannels: 1,
    };

    const mockEvent = {
      inputBuffer: mockAudioBuffer,
    };

    if (mockScriptProcessor.onaudioprocess) {
      mockScriptProcessor.onaudioprocess(mockEvent);
    }

    expect(callback).not.toHaveBeenCalled();
  });
});
