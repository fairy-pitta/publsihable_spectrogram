import { AudioBuffer } from '../entities/AudioBuffer';
import { Spectrogram } from '../entities/Spectrogram';

export interface STFTParameters {
  nFft: number;
  hopLength: number;
  windowType: 'hann' | 'hamming' | 'blackman';
  magnitudeType: 'magnitude' | 'power';
  dbMin: number;
  dbMax: number;
  useMelScale?: boolean;
  nMelBands?: number;
}

export interface ISTFTProcessor {
  process(audioBuffer: AudioBuffer, params: STFTParameters): Promise<Spectrogram>;
}
