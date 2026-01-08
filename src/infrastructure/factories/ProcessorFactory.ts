import { ISTFTProcessor } from '@domain/interfaces/ISTFTProcessor';
import { WasmSTFTProcessor } from '../wasm/WasmSTFTProcessor';

/**
 * Factory for creating STFT processor instances
 * This factory is in the Infrastructure layer and can create concrete implementations
 */
export class ProcessorFactory {
  /**
   * Creates a default STFT processor (WASM implementation)
   * @returns Promise resolving to an ISTFTProcessor instance
   */
  static async createDefault(): Promise<ISTFTProcessor> {
    return WasmSTFTProcessor.create();
  }

  /**
   * Creates a processor with a custom factory function
   * Useful for testing or alternative implementations
   * @param factory - Factory function that creates an ISTFTProcessor
   * @returns Promise resolving to an ISTFTProcessor instance
   */
  static async create(factory: () => Promise<ISTFTProcessor>): Promise<ISTFTProcessor> {
    return factory();
  }
}

