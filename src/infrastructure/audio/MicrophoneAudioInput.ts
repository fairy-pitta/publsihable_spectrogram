import { IAudioInput } from '@domain/interfaces/IAudioInput';
import { AudioBuffer } from '@domain/entities/AudioBuffer';

export class MicrophoneAudioInput implements IAudioInput {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private listeners: Set<(buffer: AudioBuffer) => void> = new Set();
  private bufferSize: number = 4096;

  async loadAudio(): Promise<AudioBuffer> {
    throw new Error('Microphone input streams audio, use onAudioData callback instead');
  }

  async start(): Promise<void> {
    if (this.audioContext) {
      return; // Already started
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processorNode = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);

      this.processorNode.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        const samples = new Float32Array(inputData.length);
        samples.set(inputData);

        const audioBuffer = new AudioBuffer(samples, this.audioContext!.sampleRate);

        // Notify all listeners
        this.listeners.forEach((callback) => {
          try {
            callback(audioBuffer);
          } catch (error) {
            console.error('Error in audio data callback:', error);
          }
        });
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);
    } catch (error) {
      throw new Error(
        `Failed to start microphone input: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  stop(): void {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.listeners.clear();
  }

  onAudioData(callback: (buffer: AudioBuffer) => void): void {
    this.listeners.add(callback);
  }

  removeAudioDataListener(callback: (buffer: AudioBuffer) => void): void {
    this.listeners.delete(callback);
  }

  isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices !== undefined &&
      navigator.mediaDevices.getUserMedia !== undefined &&
      (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined')
    );
  }
}

