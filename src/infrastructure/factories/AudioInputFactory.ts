import { IAudioInput } from '@domain/interfaces/IAudioInput';
import { FileAudioInput } from '../audio/FileAudioInput';

/**
 * Factory for creating audio input instances
 * This factory is in the Infrastructure layer and can create concrete implementations
 */
export class AudioInputFactory {
  /**
   * Creates a file-based audio input
   * @param file - The audio file to load
   * @returns IAudioInput instance configured with the file
   */
  static createFileInput(file: File): IAudioInput {
    const input = new FileAudioInput();
    input.setFile(file);
    return input;
  }
}

