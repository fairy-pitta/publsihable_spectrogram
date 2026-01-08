import { IAudioInput } from '@domain/interfaces/IAudioInput';
import { AudioBuffer } from '@domain/entities/AudioBuffer';

export class FileAudioInput implements IAudioInput {
  private file: File | null = null;

  setFile(file: File): void {
    this.file = file;
  }

  async loadAudio(): Promise<AudioBuffer> {
    if (!this.file) {
      throw new Error('No file selected');
    }

    const arrayBuffer = await this.file.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
      const decodedAudioData = await audioContext.decodeAudioData(arrayBuffer.slice(0));

      // Convert to mono if stereo
      let samples: Float32Array;
      if (decodedAudioData.numberOfChannels === 1) {
        samples = decodedAudioData.getChannelData(0);
      } else {
        // Mix down to mono by averaging channels
        const numChannels = decodedAudioData.numberOfChannels;
        const length = decodedAudioData.length;
        samples = new Float32Array(length);

        for (let i = 0; i < length; i++) {
          let sum = 0;
          for (let ch = 0; ch < numChannels; ch++) {
            sum += decodedAudioData.getChannelData(ch)[i];
          }
          samples[i] = sum / numChannels;
        }
      }

      return new AudioBuffer(samples, decodedAudioData.sampleRate);
    } catch (error) {
      throw new Error(`Failed to decode audio file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async start(): Promise<void> {
    // File input doesn't stream, so start is a no-op
  }

  stop(): void {
    // File input doesn't stream, so stop is a no-op
  }

  onAudioData(_callback: (buffer: AudioBuffer) => void): void {
    // File input doesn't stream, so this is a no-op
  }

  removeAudioDataListener(_callback: (buffer: AudioBuffer) => void): void {
    // File input doesn't stream, so this is a no-op
  }

  isSupported(): boolean {
    return typeof File !== 'undefined' && typeof AudioContext !== 'undefined';
  }
}

