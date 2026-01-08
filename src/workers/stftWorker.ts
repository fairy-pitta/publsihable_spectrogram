/// <reference lib="webworker" />

import { STFTParameters } from '@domain/interfaces/ISTFTProcessor';
import { WasmSTFTProcessor } from '@infrastructure/wasm/WasmSTFTProcessor';

let processor: WasmSTFTProcessor | null = null;

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'init':
        processor = await WasmSTFTProcessor.create();
        self.postMessage({ type: 'ready' });
        break;

      case 'process': {
        if (!processor) {
          processor = await WasmSTFTProcessor.create();
        }

        const { audioBuffer, params } = payload as {
          audioBuffer: { samples: Float32Array; sampleRate: number };
          params: STFTParameters;
        };

        const spectrogram = await processor.process(
          {
            samples: new Float32Array(audioBuffer.samples),
            sampleRate: audioBuffer.sampleRate,
          } as any,
          params
        );

        self.postMessage({
          type: 'result',
          payload: {
            data: Array.from(spectrogram.data),
            nFreqBins: spectrogram.nFreqBins,
            nTimeFrames: spectrogram.nTimeFrames,
            sampleRate: spectrogram.sampleRate,
            nFft: spectrogram.nFft,
            hopLength: spectrogram.hopLength,
          },
        });
        break;
      }

      default:
        self.postMessage({ type: 'error', payload: 'Unknown message type' });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: error instanceof Error ? error.message : String(error),
    });
  }
});

