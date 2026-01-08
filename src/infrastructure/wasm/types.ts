/**
 * Type definitions for WASM module exports
 */
export interface WasmModule {
  STFTProcessor: new (nFft: number, hopLength: number, windowType: string) => STFTProcessorInstance;
  NoiseReducer: new () => NoiseReducerInstance;
  compute_mel_filter_bank: (nMels: number, nFft: number, sampleRate: number, fmin: number, fmax: number) => Float32Array;
  apply_log_frequency_scale: (data: Float32Array, nFreqBins: number, nTimeFrames: number, sampleRate: number, nFft: number) => Float32Array;
  hz_to_mel: (hz: number) => number;
  mel_to_hz: (mel: number) => number;
  default: () => Promise<void>;
  readonly memory: WebAssembly.Memory;
}

export interface STFTProcessorInstance {
  process(audioData: Float32Array, sampleRate: number): Float32Array;
  to_db(magnitudeSpectrum: Float32Array, refDb: number, topDb: number, minDb: number, maxDb: number): Float32Array;
  nFft: number;
  hopLength: number;
  windowType: string;
  free(): void;
}

export interface NoiseReducerInstance {
  estimate_noise(noiseSegment: Float32Array): void;
  reduce_noise(magnitudeSpectrum: Float32Array, alpha: number, beta: number): Float32Array;
  free(): void;
}

