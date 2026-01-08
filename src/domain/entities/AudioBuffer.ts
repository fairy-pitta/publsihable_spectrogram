export class AudioBuffer {
  constructor(
    public readonly samples: Float32Array,
    public readonly sampleRate: number
  ) {
    if (sampleRate <= 0) {
      throw new Error('Sample rate must be positive');
    }
  }

  get length(): number {
    return this.samples.length;
  }

  get duration(): number {
    return this.samples.length / this.sampleRate;
  }
}

