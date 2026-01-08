import { IAudioInput, ISTFTProcessor, STFTParameters } from '@domain/interfaces/ISTFTProcessor';
import { AudioBuffer } from '@domain/entities/AudioBuffer';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { loadWasm } from './wasmLoader';
import type { WasmModule, STFTProcessorInstance } from './types';

export class WasmSTFTProcessor implements ISTFTProcessor {
  private wasmModule: WasmModule | null = null;
  private processor: STFTProcessorInstance | null = null;

  private constructor(wasmModule: WasmModule) {
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

    // Apply dB conversion with ref and top_db
    const refDb = params.refDb ?? 0.0; // 0.0 means use maximum as reference
    const topDb = params.topDb ?? 80.0; // Default top_db is 80
    let dbData = this.processor.to_db(spectrumData, refDb, topDb, params.dbMin, params.dbMax) as Float32Array;

    // Safety net:
    // If wasm-side dB conversion returns near-constant values (e.g., all 0dB),
    // recompute dB here to avoid a fully-saturated (all-yellow) spectrogram.
    {
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < dbData.length; i++) {
        const v = dbData[i];
        if (!Number.isFinite(v)) continue;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (!Number.isFinite(min) || !Number.isFinite(max) || Math.abs(max - min) < 1e-3) {
        const refValue = spectrumData.reduce((a, b) => (b > a ? b : a), 0);
        const factor = params.magnitudeType === 'power' ? 10.0 : 20.0;
        const recomputed = new Float32Array(spectrumData.length);
        const clipFloor = -topDb;
        const denom = refValue > 0 ? refValue : 1.0;
        for (let i = 0; i < spectrumData.length; i++) {
          const m = spectrumData[i];
          let db = m > 0 ? factor * Math.log10(m / denom) : params.dbMin;
          if (!Number.isFinite(db)) db = params.dbMin;
          db = Math.max(db, clipFloor);
          db = Math.min(db, params.dbMax);
          db = Math.max(db, params.dbMin);
          recomputed[i] = db;
        }
        dbData = recomputed;
      }
    }

    // Store sample rate in params if not already set
    const paramsWithSampleRate = {
      ...params,
      sampleRate: params.sampleRate || audioBuffer.sampleRate,
    };

    // Calculate dimensions (may change if log-frequency scale is applied)
    let nFreqBins = Math.floor(params.nFft / 2) + 1;
    const nTimeFrames = Math.ceil(audioBuffer.length / params.hopLength);

    // Apply mel scale or log-frequency scale if requested
    let finalData = dbData;
    let finalNFreqBins = nFreqBins;
    if (params.useMelScale && params.nMelBands) {
      finalData = this.applyMelScale(dbData, nFreqBins, nTimeFrames, paramsWithSampleRate);
      finalNFreqBins = params.nMelBands;
    } else if (params.useLogFrequency) {
      finalData = this.applyLogFrequencyScale(dbData, nFreqBins, nTimeFrames, paramsWithSampleRate);
      // Log-frequency scale maintains the same number of bins
      finalNFreqBins = nFreqBins;
    }

    // Ensure data matches expected dimensions
    const expectedLength = finalNFreqBins * nTimeFrames;
    if (finalData.length !== expectedLength) {
      // Fill missing values with dbMin (not 0dB) to avoid showing max-color artifacts.
      const correctedData = new Float32Array(expectedLength);
      correctedData.fill(params.dbMin);
      const copyLength = Math.min(finalData.length, expectedLength);
      correctedData.set(finalData.subarray(0, copyLength));
      finalData = correctedData;
    }

    // WASM output is time-major: [t0(f0..fN), t1(f0..fN), ...]
    // Domain `Spectrogram` expects freq-major: [f0(t0..tN), f1(t0..tN), ...]
    const freqMajorData = new Float32Array(expectedLength);
    for (let t = 0; t < nTimeFrames; t++) {
      for (let f = 0; f < finalNFreqBins; f++) {
        freqMajorData[f * nTimeFrames + t] = finalData[t * finalNFreqBins + f];
      }
    }

    return new Spectrogram(
      freqMajorData,
      finalNFreqBins,
      nTimeFrames,
      audioBuffer.sampleRate,
      params.nFft,
      params.hopLength
    );
  }

  private shouldRecreateProcessor(params: STFTParameters): boolean {
    if (!this.processor || !this.wasmModule) return true;

    // Check if processor parameters match
    const processor = this.processor as unknown as { nFft?: number; hopLength?: number; windowType?: string };
    return (
      processor.nFft !== params.nFft ||
      processor.hopLength !== params.hopLength ||
      processor.windowType !== params.windowType
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

    const sampleRate = params.sampleRate || 44100;
    const melFilterBankFlat = this.wasmModule.compute_mel_filter_bank(
      params.nMelBands,
      params.nFft,
      sampleRate,
      0,
      sampleRate / 2
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

  private applyLogFrequencyScale(
    data: Float32Array,
    nFreqBins: number,
    nTimeFrames: number,
    params: STFTParameters
  ): Float32Array {
    const sampleRate = params.sampleRate || 44100;
    const logData = this.wasmModule.apply_log_frequency_scale(
      data,
      nFreqBins,
      nTimeFrames,
      sampleRate,
      params.nFft
    );
    return new Float32Array(logData);
  }
}
