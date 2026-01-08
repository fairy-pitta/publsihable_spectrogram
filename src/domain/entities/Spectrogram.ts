export class Spectrogram {
  constructor(
    public readonly data: Float32Array,
    public readonly nFreqBins: number,
    public readonly nTimeFrames: number,
    public readonly sampleRate: number,
    public readonly nFft: number,
    public readonly hopLength: number
  ) {
    if (data.length !== nFreqBins * nTimeFrames) {
      throw new Error('Data length must match nFreqBins * nTimeFrames');
    }
    if (nFreqBins <= 0 || nTimeFrames <= 0) {
      throw new Error('nFreqBins and nTimeFrames must be positive');
    }
  }

  get duration(): number {
    return ((this.nTimeFrames - 1) * this.hopLength) / this.sampleRate;
  }

  get frequencyResolution(): number {
    return this.sampleRate / this.nFft;
  }

  getValue(freqBin: number, timeFrame: number): number {
    if (
      freqBin < 0 ||
      freqBin >= this.nFreqBins ||
      timeFrame < 0 ||
      timeFrame >= this.nTimeFrames
    ) {
      return 0;
    }
    return this.data[freqBin * this.nTimeFrames + timeFrame];
  }

  getFrequency(freqBin: number): number {
    return (freqBin * this.sampleRate) / this.nFft;
  }

  getTime(timeFrame: number): number {
    return (timeFrame * this.hopLength) / this.sampleRate;
  }
}

