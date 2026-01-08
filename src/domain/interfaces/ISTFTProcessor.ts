import { AudioBuffer } from '../entities/AudioBuffer';
import { Spectrogram } from '../entities/Spectrogram';

export interface STFTParameters {
  nFft: number;
  hopLength: number;
  windowType: 'hann' | 'hamming' | 'blackman';
  magnitudeType: 'magnitude' | 'power';
  dbMin: number;
  dbMax: number;
  refDb?: number; // Reference dB level (0.0 means use maximum as reference)
  topDb?: number; // Top dB clipping (default 80)
  useMelScale?: boolean;
  nMelBands?: number;
  useLogFrequency?: boolean; // Use log-frequency scale instead of linear
  sampleRate?: number; // Sample rate for log-frequency scale calculation
}

export interface ISTFTProcessor {
  process(audioBuffer: AudioBuffer, params: STFTParameters): Promise<Spectrogram>;
}
