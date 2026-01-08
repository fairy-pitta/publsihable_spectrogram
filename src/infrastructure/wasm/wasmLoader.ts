import type { WasmModule } from './types';

let wasmModule: WasmModule | null = null;

/**
 * Loads the WASM module if not already loaded
 * @returns Promise resolving to the WASM module
 * @throws Error if WASM module cannot be loaded
 */
export async function loadWasm(): Promise<WasmModule> {
  if (wasmModule) {
    return wasmModule;
  }

  try {
    // Dynamic import for WASM module
    // This will be the actual WASM module after building with wasm-pack
    const module = await import('./pkg/spectrogram_wasm');
    await module.default();
    wasmModule = module as unknown as WasmModule;
    return wasmModule;
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw new Error('WASM module not available. Please build it first with: npm run build:wasm');
  }
}

