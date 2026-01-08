import { IAudioInput } from '@domain/interfaces/IAudioInput';
import { ISTFTProcessor, STFTParameters } from '@domain/interfaces/ISTFTProcessor';
import { AudioBuffer } from '@domain/entities/AudioBuffer';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { WasmSTFTProcessor } from '@infrastructure/wasm/WasmSTFTProcessor';

export class AudioProcessingService {
  private processor: ISTFTProcessor | null = null;

  private constructor(processor: ISTFTProcessor) {
    this.processor = processor;
  }

  static async create(): Promise<AudioProcessingService> {
    const processor = await WasmSTFTProcessor.create();
    return new AudioProcessingService(processor);
  }

  async processAudio(audioBuffer: AudioBuffer, params: STFTParameters): Promise<Spectrogram> {
    if (!this.processor) {
      throw new Error('Processor not initialized');
    }

    return this.processor.process(audioBuffer, params);
  }

  async loadAudioFromInput(input: IAudioInput): Promise<AudioBuffer> {
    return input.loadAudio();
  }

  setProcessor(processor: ISTFTProcessor): void {
    this.processor = processor;
  }
}
