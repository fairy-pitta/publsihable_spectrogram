let wasmModule: any = null;

export async function loadWasm(): Promise<any> {
  if (wasmModule) {
    return wasmModule;
  }

  try {
    // Dynamic import for WASM module
    // This will be the actual WASM module after building with wasm-pack
    wasmModule = await import('./pkg/spectrogram_wasm');
    await wasmModule.default();
    return wasmModule;
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw new Error('WASM module not available. Please build it first with: npm run build:wasm');
  }
}
