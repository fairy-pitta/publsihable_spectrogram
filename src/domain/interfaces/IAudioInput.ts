import { AudioBuffer } from '../entities/AudioBuffer';

export interface IAudioInput {
  loadAudio(): Promise<AudioBuffer>;
  start(): Promise<void>;
  stop(): void;
  onAudioData(callback: (buffer: AudioBuffer) => void): void;
  removeAudioDataListener(callback: (buffer: AudioBuffer) => void): void;
  isSupported(): boolean;
}

