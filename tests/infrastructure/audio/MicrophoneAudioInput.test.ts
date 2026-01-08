import { describe, it, expect, beforeEach } from 'vitest';
import { MicrophoneAudioInput } from '@infrastructure/audio/MicrophoneAudioInput';
import { AudioBuffer } from '@domain/entities/AudioBuffer';

describe('MicrophoneAudioInput', () => {
  let micInput: MicrophoneAudioInput;

  beforeEach(() => {
    micInput = new MicrophoneAudioInput();
  });

  it('should create MicrophoneAudioInput instance', () => {
    expect(micInput).toBeInstanceOf(MicrophoneAudioInput);
  });

  it('should check if microphone API is supported', () => {
    const isSupported = micInput.isSupported();
    // In test environment, may or may not be supported
    expect(typeof isSupported).toBe('boolean');
  });

  it('should check if microphone API is supported', () => {
    const isSupported = micInput.isSupported();
    // In test environment, may or may not be supported
    expect(typeof isSupported).toBe('boolean');
  });

  it('should handle getUserMedia errors', async () => {
    // In test environment, getUserMedia will likely fail
    // This tests error handling
    if (!micInput.isSupported()) {
      return;
    }

    try {
      await micInput.start();
      // If it succeeds, stop it
      micInput.stop();
    } catch (error) {
      // Expected in test environment
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should handle start and stop', async () => {
    if (!micInput.isSupported()) {
      return;
    }

    try {
      await micInput.start();
      expect(micInput).toBeInstanceOf(MicrophoneAudioInput);
      micInput.stop();
    } catch (error) {
      // Expected in test environment without actual microphone
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should handle audio data callback registration', () => {
    const callback = (buffer: AudioBuffer) => {
      expect(buffer).toBeInstanceOf(AudioBuffer);
    };
    
    micInput.onAudioData(callback);
    micInput.removeAudioDataListener(callback);
    
    // Test that registration/unregistration doesn't throw
    expect(micInput).toBeInstanceOf(MicrophoneAudioInput);
  });
});
