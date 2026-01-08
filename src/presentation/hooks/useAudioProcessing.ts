import { useState, useCallback, useEffect } from 'react';
import { AudioProcessingService } from '@application/services/AudioProcessingService';
import { IAudioInput } from '@domain/interfaces/IAudioInput';
import { AudioBuffer } from '@domain/entities/AudioBuffer';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { STFTParameters } from '@domain/interfaces/ISTFTProcessor';

export function useAudioProcessing() {
  const [audioProcessingService, setAudioProcessingService] = useState<AudioProcessingService | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [spectrogram, setSpectrogram] = useState<Spectrogram | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AudioProcessingService.create().then(setAudioProcessingService).catch((err) => {
      setError(err.message);
    });
  }, []);

  const loadAudio = useCallback(async (input: IAudioInput) => {
    try {
      setError(null);
      setIsProcessing(true);
      // Clear old spectrogram when loading new audio
      setSpectrogram(null);
      const buffer = await input.loadAudio();
      setAudioBuffer(buffer);
      return buffer;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audio';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processAudio = useCallback(async (params: STFTParameters) => {
    if (!audioProcessingService || !audioBuffer) {
      throw new Error('Audio processing service or audio buffer not available');
    }

    try {
      setError(null);
      setIsProcessing(true);
      const result = await audioProcessingService.processAudio(audioBuffer, params);
      setSpectrogram(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process audio';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [audioProcessingService, audioBuffer]);

  const clearAudio = useCallback(() => {
    setAudioBuffer(null);
    setSpectrogram(null);
    setError(null);
  }, []);

  return {
    audioBuffer,
    spectrogram,
    isProcessing,
    error,
    loadAudio,
    processAudio,
    clearAudio,
    isReady: audioProcessingService !== null,
  };
}
