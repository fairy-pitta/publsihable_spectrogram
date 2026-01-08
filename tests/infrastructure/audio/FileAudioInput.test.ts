import { describe, it, expect, beforeEach } from 'vitest';
import { FileAudioInput } from '@infrastructure/audio/FileAudioInput';
import { AudioBuffer } from '@domain/entities/AudioBuffer';

describe('FileAudioInput', () => {
  let fileInput: FileAudioInput;

  beforeEach(() => {
    fileInput = new FileAudioInput();
  });

  it('should create FileAudioInput instance', () => {
    expect(fileInput).toBeInstanceOf(FileAudioInput);
  });

  it('should check if File API is supported', () => {
    const isSupported = fileInput.isSupported();
    // In test environment, AudioContext may not be available
    expect(typeof isSupported).toBe('boolean');
  });

  it('should load audio from File', async () => {
    // Create a minimal WAV file header and data
    // WAV file structure: RIFF header + fmt chunk + data chunk
    const sampleRate = 44100;
    const numSamples = 4;
    const samples = new Float32Array([0.1, 0.2, 0.3, 0.4]);
    
    // Convert float samples to 16-bit PCM
    const pcmData = new Int16Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      pcmData[i] = Math.max(-32768, Math.min(32767, samples[i] * 32768));
    }
    
    // Create minimal WAV file
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    // RIFF header
    const textEncoder = new TextEncoder();
    const riff = textEncoder.encode('RIFF');
    const wave = textEncoder.encode('WAVE');
    const fmt = textEncoder.encode('fmt ');
    const data = textEncoder.encode('data');
    
    view.setUint8(0, riff[0]); view.setUint8(1, riff[1]); view.setUint8(2, riff[2]); view.setUint8(3, riff[3]);
    view.setUint32(4, 36 + numSamples * 2, true); // File size - 8
    view.setUint8(8, wave[0]); view.setUint8(9, wave[1]); view.setUint8(10, wave[2]); view.setUint8(11, wave[3]);
    
    // fmt chunk
    view.setUint8(12, fmt[0]); view.setUint8(13, fmt[1]); view.setUint8(14, fmt[2]); view.setUint8(15, fmt[3]);
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, 1, true); // num channels
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    
    // data chunk
    view.setUint8(36, data[0]); view.setUint8(37, data[1]); view.setUint8(38, data[2]); view.setUint8(39, data[3]);
    view.setUint32(40, numSamples * 2, true); // data chunk size
    
    // Combine header and PCM data
    const pcmBuffer = pcmData.buffer;
    const wavFile = new Uint8Array(wavHeader.byteLength + pcmBuffer.byteLength);
    wavFile.set(new Uint8Array(wavHeader), 0);
    wavFile.set(new Uint8Array(pcmBuffer), wavHeader.byteLength);
    
    const file = new File([wavFile], 'test.wav', { type: 'audio/wav' });
    fileInput.setFile(file);

    // Note: This test requires actual AudioContext which may not work in test environment
    // If AudioContext is not available, skip the test
    if (typeof AudioContext === 'undefined') {
      return;
    }

    const buffer = await fileInput.loadAudio();

    expect(buffer).toBeInstanceOf(AudioBuffer);
    expect(buffer.sampleRate).toBe(sampleRate);
    expect(buffer.length).toBe(numSamples);
  });

  it('should convert stereo to mono', async () => {
    // Create a minimal stereo WAV file
    const sampleRate = 44100;
    const numSamples = 2;
    const leftSamples = new Float32Array([0.1, 0.2]);
    const rightSamples = new Float32Array([0.3, 0.4]);
    
    // Convert float samples to 16-bit PCM (interleaved stereo)
    const pcmData = new Int16Array(numSamples * 2);
    for (let i = 0; i < numSamples; i++) {
      pcmData[i * 2] = Math.max(-32768, Math.min(32767, leftSamples[i] * 32768));
      pcmData[i * 2 + 1] = Math.max(-32768, Math.min(32767, rightSamples[i] * 32768));
    }
    
    // Create minimal WAV file (similar to above but with 2 channels)
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const textEncoder = new TextEncoder();
    const riff = textEncoder.encode('RIFF');
    const wave = textEncoder.encode('WAVE');
    const fmt = textEncoder.encode('fmt ');
    const data = textEncoder.encode('data');
    
    view.setUint8(0, riff[0]); view.setUint8(1, riff[1]); view.setUint8(2, riff[2]); view.setUint8(3, riff[3]);
    view.setUint32(4, 36 + numSamples * 4, true);
    view.setUint8(8, wave[0]); view.setUint8(9, wave[1]); view.setUint8(10, wave[2]); view.setUint8(11, wave[3]);
    
    view.setUint8(12, fmt[0]); view.setUint8(13, fmt[1]); view.setUint8(14, fmt[2]); view.setUint8(15, fmt[3]);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 2, true); // 2 channels
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    
    view.setUint8(36, data[0]); view.setUint8(37, data[1]); view.setUint8(38, data[2]); view.setUint8(39, data[3]);
    view.setUint32(40, numSamples * 4, true);
    
    const pcmBuffer = pcmData.buffer;
    const wavFile = new Uint8Array(wavHeader.byteLength + pcmBuffer.byteLength);
    wavFile.set(new Uint8Array(wavHeader), 0);
    wavFile.set(new Uint8Array(pcmBuffer), wavHeader.byteLength);
    
    const file = new File([wavFile], 'test.wav', { type: 'audio/wav' });
    fileInput.setFile(file);

    if (typeof AudioContext === 'undefined') {
      return;
    }

    const buffer = await fileInput.loadAudio();

    expect(buffer).toBeInstanceOf(AudioBuffer);
    expect(buffer.length).toBe(numSamples);
    // Stereo to mono: average of two channels
    expect(buffer.samples[0]).toBeCloseTo(0.2, 1); // (0.1 + 0.3) / 2
    expect(buffer.samples[1]).toBeCloseTo(0.3, 1); // (0.2 + 0.4) / 2
  });

  it('should handle decode errors', async () => {
    // Create invalid audio file
    const invalidFile = new File(['invalid audio data'], 'test.wav', { type: 'audio/wav' });
    fileInput.setFile(invalidFile);

    if (typeof AudioContext === 'undefined') {
      return;
    }

    await expect(fileInput.loadAudio()).rejects.toThrow();
  });
});
