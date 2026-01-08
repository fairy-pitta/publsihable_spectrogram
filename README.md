# Client-Side Real-Time Spectrogram Generator

A high-quality spectrogram generator that runs entirely in the browser. DSP processing is performed in Rust+WASM, while UI, visualization, annotations, and export are implemented in TypeScript+React.

## Technical Overview

This project is a fully browser-based spectrogram generation system. It converts audio signals to the frequency domain and visualizes them as time-frequency representations. To optimize performance, computationally intensive processing is implemented in Rust and compiled to WebAssembly.

## Features

- **Audio Input**
  - WAV file upload
  - Microphone input (real-time)
  
- **STFT Processing (WASM)**
  - Configurable parameters (n_fft, hop_length, window functions)
  - Magnitude/Power spectrum
  - dB conversion (adjustable range)
  - Optional: Mel scale conversion
  - Spectral subtraction noise reduction

- **Visualization**
  - Canvas 2D rendering
  - Colormaps (viridis, magma, grayscale)
  - Brightness, contrast, and gamma adjustment
  - Axis and colorbar display

- **Annotations**
  - Text labels
  - Arrows
  - Rectangles/highlights
  - SVG-based (vector format)

- **Export**
  - SVG (spectrogram + annotations)
  - PNG (high resolution, user-specified DPI)

## Technology Stack

### Frontend
- **TypeScript 5.5.3**: Type safety and improved developer experience
- **React 18.3.1**: UI framework using Hooks API
- **Vite 5.4.2**: Fast development server and build tool
- **Canvas 2D API**: Spectrogram rendering
- **SVG**: Vector drawing for annotations

### DSP Processing
- **Rust**: High-performance numerical computation
- **WebAssembly (WASM)**: Near-native performance in the browser
- **wasm-pack + wasm-bindgen**: Rust-JavaScript bindings
- **rustfft**: FFT computation library

### Testing & Development
- **Vitest 1.6.0**: Fast unit testing framework
- **@testing-library/react**: React component testing
- **TypeScript Strict Mode**: Strict type checking

### Architecture
- **Clean Architecture**: Layer separation and dependency inversion principles
- **Dependency Injection**: Dependency management via factory pattern
- **Interface-based Design**: Abstraction through domain interfaces

## Setup

### Prerequisites

- Node.js 18+
- Rust (wasm-pack required)

### Installation

```bash
# 1. Install dependencies (run first)
npm install

# 2. Build WASM module (after npm install)
npm run build:wasm
```

**Note**: 
- Running `npm install` is required, otherwise you'll get `vite: command not found` error.
- The WASM module must be built before running `npm run build` or `npm run dev`.
- The `prebuild` script automatically builds WASM before TypeScript compilation.

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Test UI
npm run test:ui
```

### Build

```bash
npm run build
```

## Project Structure

```
publishable_spectrogram/
├── wasm/                    # Rust WASM project
│   ├── src/
│   │   ├── lib.rs          # WASM entry point, wasm-bindgen bindings
│   │   ├── stft.rs         # STFT implementation (FFT, window functions, dB conversion)
│   │   ├── noise_reduction.rs  # Spectral subtraction noise reduction
│   │   └── utils.rs        # Mel scale conversion, utility functions
│   └── Cargo.toml
├── src/
│   ├── domain/              # Domain Layer (business logic)
│   │   ├── entities/       # Entities (Spectrogram, Annotation, AudioBuffer)
│   │   └── interfaces/     # Interfaces (IRenderer, ISTFTProcessor, IAudioInput)
│   ├── application/         # Application Layer (use cases)
│   │   └── services/       # Services (AudioProcessingService, ExportService, etc.)
│   ├── infrastructure/      # Infrastructure Layer (implementations)
│   │   ├── wasm/           # WASM module wrapper
│   │   ├── renderer/       # Canvas renderer, colormap
│   │   ├── annotation/     # SVG annotation layer
│   │   ├── audio/          # Audio input (file, microphone)
│   │   └── factories/      # Factories for dependency injection
│   └── presentation/        # Presentation Layer (UI)
│       ├── components/     # React components
│       └── hooks/          # Custom hooks
└── tests/                   # Unit tests
```

## Architecture Details

### Clean Architecture Layer Structure

This project follows Clean Architecture principles and is separated into 4 layers:

1. **Domain Layer** (`src/domain/`)
   - Core business logic
   - Pure TypeScript with no dependencies on other layers
   - Defines entities and interfaces

2. **Application Layer** (`src/application/`)
   - Orchestrates use cases
   - Depends only on Domain layer interfaces
   - Implements business rules

3. **Infrastructure Layer** (`src/infrastructure/`)
   - Implements external technologies (WASM, Canvas, SVG)
   - Implements Domain layer interfaces
   - Manages dependencies via factory pattern

4. **Presentation Layer** (`src/presentation/`)
   - React components and UI logic
   - Depends on Application and Domain layers
   - Handles user interactions

### Dependency Direction

```
Presentation → Application → Domain
Infrastructure → Domain (interface implementation)
Application → Domain (interface usage)
```

This structure allows each layer to be tested independently, and changes to implementation details don't affect other layers.

## Algorithm Details

### STFT (Short-Time Fourier Transform)

The STFT, which is the core of spectrogram generation, is implemented with the following steps:

1. **Window Function Application**
   - Supports Hann, Hamming, and Blackman windows
   - Reduces spectral leakage and improves frequency resolution

2. **FFT Computation** (Rust/WASM)
   - Fast FFT using `rustfft` library
   - Converts to frequency domain using complex FFT
   - Computes magnitude spectrum

3. **dB Conversion**
   - Converts from linear scale to logarithmic scale (dB)
   - Configurable reference level (refDb) and clipping range (topDb)
   - Formula: `dB = 20 * log10(magnitude / refValue)` (magnitude) or `10 * log10(power / refValue)` (power)

4. **Time-Frequency Matrix Construction**
   - Combines spectra from each time frame
   - Frequency-major format: `[freq0(t0..tN), freq1(t0..tN), ...]`

### Rendering Techniques

#### Bilinear Interpolation

For spectrogram visualization, bilinear interpolation is used to smoothly interpolate between discrete data points:

```
v0 = v00 * (1 - dt) + v01 * dt  // Interpolate along time axis
v1 = v10 * (1 - dt) + v11 * dt
result = v0 * (1 - df) + v1 * df  // Interpolate along frequency axis
```

This enables smooth display even when zoomed in.

#### Color Mapping

- **Viridis**: Continuous colormap suitable for scientific visualization
- **Magma**: High-contrast colormap
- **Grayscale**: Monochrome display

Each colormap converts normalized values (0-1) to RGB values. Brightness, contrast, and gamma correction can also be applied.

#### Smoothing and Oversampling

- **Gaussian Smoothing**: Spatial smoothing using 3x3 Gaussian kernel
- **Oversampling**: 2x interpolation along time axis to improve time resolution

### Performance Optimizations

1. **High-Speed Computation with WASM**
   - FFT computation implemented in Rust and compiled to WASM
   - 10-100x faster numerical computation than JavaScript

2. **Canvas 2D API Optimization**
   - Direct `ImageData` manipulation for pixel-level drawing
   - High DPI display support (devicePixelRatio consideration)

3. **Memory Efficiency**
   - Efficient memory management using `Float32Array`
   - Suppresses memory usage even with large audio files

4. **Event-Based Synchronization**
   - Event-driven annotation synchronization instead of polling
   - Reduces unnecessary re-renders

## Data Flow

```
1. Audio Input (FileAudioInput/MicrophoneAudioInput)
   ↓
2. AudioBuffer (Float32Array + sampleRate)
   ↓
3. WASM STFT Processor
   - Window function application
   - FFT computation
   - dB conversion
   ↓
4. Spectrogram Entity
   - Frequency-major format data
   - Metadata (nFreqBins, nTimeFrames, etc.)
   ↓
5. Canvas Renderer
   - Bilinear interpolation
   - Color mapping
   - Canvas drawing
   ↓
6. SVG Annotation Layer
   - Annotation addition/update
   ↓
7. Export Service
   - PNG/SVG export
```

## Usage

1. Upload a WAV file or start microphone input
2. Configure STFT parameters (click "Recompute" if needed)
3. Adjust display options (real-time updates)
4. Add annotations as needed
5. Export SVG/PNG using the "Export" button

### STFT Parameter Descriptions

- **n_fft**: FFT size (default: 2048). Larger values improve frequency resolution but reduce time resolution
- **hop_length**: Frame overlap (default: 512). Smaller values improve time resolution
- **window_type**: Window function (Hann/Hamming/Blackman). Affects spectral leakage suppression
- **magnitude_type**: Magnitude or power spectrum

### Display Options

- **Colormap**: Colormap selection
- **Brightness/Contrast/Gamma**: Visual adjustments
- **Smoothing**: Spatial smoothing (0.0-1.0)
- **Oversampling**: 2x interpolation along time axis
- **Axis Ranges**: Time and frequency axis range specification (zoom feature)

## Technical Implementation Details

### WASM Module

The WASM module is built using `wasm-pack`:

```bash
cd wasm
wasm-pack build --target web --out-dir ../src/infrastructure/wasm/pkg
```

Generated files:
- `spectrogram_wasm.js`: JavaScript bindings
- `spectrogram_wasm_bg.wasm`: Compiled WASM binary
- `spectrogram_wasm.d.ts`: TypeScript type definitions

### Type Safety

TypeScript strict mode is enabled with the following settings to ensure type safety:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

### Path Aliases

Path aliases are configured in `tsconfig.json` and `vite.config.ts`:

```typescript
@domain/* → src/domain/*
@application/* → src/application/*
@infrastructure/* → src/infrastructure/*
@presentation/* → src/presentation/*
```

This allows importing with meaningful paths instead of relative paths.

### Export Features

- **PNG**: High-resolution export (DPI configurable, default 300 DPI)
  - Renders canvas scaled up
  - Integrates annotations

- **SVG**: Vector format export
  - Embeds canvas image as base64
  - Integrates SVG annotations
  - Maintains quality when scaled

## Development Guidelines

### Code Style

- TypeScript strict mode required
- Follow Clean Architecture principles
- Interface-based design
- Use dependency injection pattern

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Test runner with UI
npm run test:ui
```

Tests can be run independently for each layer.

### Build

```bash
# Development build
npm run dev

# Production build
npm run build

# Preview
npm run preview
```

## Dependencies

### Production Dependencies
- `react`, `react-dom`: UI framework

### Development Dependencies
- `typescript`: Type checking
- `vite`: Build tool
- `vitest`: Testing framework
- `@testing-library/react`: React testing utilities

### Rust Dependencies (wasm/)
- `wasm-bindgen`: Rust-JavaScript bindings
- `rustfft`: FFT computation library

## Limitations and Future Improvements

### Current Limitations
- Audio file size limitations (due to memory usage)
- Real-time processing only for microphone input
- Mel scale conversion is implemented but not exposed in UI

### Future Improvements
- Background processing with Web Workers
- GPU-accelerated rendering with WebGL
- More colormap options
- Annotation import/export functionality

## License

MIT
