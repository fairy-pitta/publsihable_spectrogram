import { IAudioInput, ISTFTProcessor, STFTParameters } from '@domain/interfaces/ISTFTProcessor';
import { AudioBuffer } from '@domain/entities/AudioBuffer';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { loadWasm } from './wasmLoader';

export class WasmSTFTProcessor implements ISTFTProcessor {
  private wasmModule: any = null;
  private processor: any = null;

  private constructor(wasmModule: any) {
    this.wasmModule = wasmModule;
  }

  static async create(): Promise<WasmSTFTProcessor> {
    const wasmModule = await loadWasm();
    return new WasmSTFTProcessor(wasmModule);
  }

  async process(audioBuffer: AudioBuffer, params: STFTParameters): Promise<Spectrogram> {
    if (!this.processor || this.shouldRecreateProcessor(params)) {
      this.processor = new this.wasmModule.STFTProcessor(
        params.nFft,
        params.hopLength,
        params.windowType
      );
    }

    // Process audio data
    const magnitudeData = this.processor.process(
      audioBuffer.samples,
      audioBuffer.sampleRate
    );

    // Convert to power spectrum if needed
    let spectrumData: Float32Array;
    if (params.magnitudeType === 'power') {
      spectrumData = new Float32Array(magnitudeData.length);
      for (let i = 0; i < magnitudeData.length; i++) {
        spectrumData[i] = magnitudeData[i] * magnitudeData[i];
      }
    } else {
      spectrumData = magnitudeData;
    }

    // Apply dB conversion
    const dbData = this.processor.to_db(spectrumData, params.dbMin, params.dbMax);

    // Calculate dimensions
    const nFreqBins = Math.floor(params.nFft / 2) + 1;
    const nTimeFrames = Math.ceil(audioBuffer.length / params.hopLength);

    // Apply mel scale if requested
    let finalData = dbData;
    if (params.useMelScale && params.nMelBands) {
      finalData = this.applyMelScale(dbData, nFreqBins, nTimeFrames, params);
    }

    // Ensure data matches expected dimensions
    const expectedLength = nFreqBins * nTimeFrames;
    if (finalData.length !== expectedLength) {
      const correctedData = new Float32Array(expectedLength);
      const copyLength = Math.min(finalData.length, expectedLength);
      correctedData.set(finalData.subarray(0, copyLength));
      finalData = correctedData;
    }

    return new Spectrogram(
      finalData,
      nFreqBins,
      nTimeFrames,
      audioBuffer.sampleRate,
      params.nFft,
      params.hopLength
    );
  }

  private shouldRecreateProcessor(params: STFTParameters): boolean {
    if (!this.processor) return true;

    return (
      this.processor.nFft !== params.nFft ||
      this.processor.hopLength !== params.hopLength ||
      this.processor.windowType !== params.windowType
    );
  }

  private applyMelScale(
    data: Float32Array,
    nFreqBins: number,
    nTimeFrames: number,
    params: STFTParameters
  ): Float32Array {
    if (!params.nMelBands) {
      return data;
    }

    const sampleRate = params.nFft; // Approximate from n_fft
    const melFilterBankFlat = this.wasmModule.compute_mel_filter_bank(
      params.nMelBands,
      params.nFft,
      sampleRate * 2, // Approximate sample rate
      0,
      sampleRate
    );

    const nBins = Math.floor(params.nFft / 2) + 1;
    const melData = new Float32Array(params.nMelBands * nTimeFrames);

    for (let t = 0; t < nTimeFrames; t++) {
      for (let m = 0; m < params.nMelBands; m++) {
        let sum = 0;
        // Access flattened filter bank: [filter0[0..nBins], filter1[0..nBins], ...]
        const filterStart = m * nBins;
        for (let f = 0; f < nFreqBins && f < nBins; f++) {
          sum += data[t * nFreqBins + f] * melFilterBankFlat[filterStart + f];
        }
        melData[t * params.nMelBands + m] = sum;
      }
    }

    return melData;
  }
}
