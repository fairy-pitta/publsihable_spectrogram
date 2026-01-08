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
    // The type definition file (spectrogram_wasm.d.ts) is committed to the repo
    // to allow TypeScript to resolve the import during type checking
    // NOTE: Keep the path non-literal so test/build pipelines that don't have
    // the generated `pkg/` outputs can still run and handle the runtime error.
    // Vite/Vitest may try to resolve literal dynamic imports at transform time.
    const modulePath = './pkg/' + 'spectrogram_wasm';
    const module = await import(/* @vite-ignore */ modulePath);
    await module.default();
    wasmModule = module as unknown as WasmModule;
    return wasmModule;
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw new Error('WASM module not available. Please build it first with: npm run build:wasm');
  }
}

