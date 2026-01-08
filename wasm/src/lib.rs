pub mod stft;
pub mod noise_reduction;
pub mod utils;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct STFTProcessor {
    processor: stft::STFTProcessor,
}

#[wasm_bindgen]
impl STFTProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(n_fft: usize, hop_length: usize, window_type: String) -> Self {
        let window = match window_type.as_str() {
            "hann" => stft::WindowType::Hann,
            "hamming" => stft::WindowType::Hamming,
            "blackman" => stft::WindowType::Blackman,
            _ => stft::WindowType::Hann,
        };
        Self {
            processor: stft::STFTProcessor::new(n_fft, hop_length, window),
        }
    }

    #[wasm_bindgen]
    pub fn process(&self, audio_data: &[f32], sample_rate: usize) -> Vec<f32> {
        self.processor.process(audio_data, sample_rate)
    }

    #[wasm_bindgen]
    pub fn to_db(&self, magnitude_spectrum: &[f32], min_db: f32, max_db: f32) -> Vec<f32> {
        self.processor.to_db(magnitude_spectrum, min_db, max_db)
    }
}

#[wasm_bindgen]
pub struct NoiseReducer {
    reducer: noise_reduction::SpectralSubtraction,
}

#[wasm_bindgen]
impl NoiseReducer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            reducer: noise_reduction::SpectralSubtraction::new(),
        }
    }

    #[wasm_bindgen]
    pub fn estimate_noise(&mut self, noise_segment: &[f32]) {
        self.reducer.estimate_noise(noise_segment);
    }

    #[wasm_bindgen]
    pub fn reduce_noise(&self, magnitude_spectrum: &[f32], alpha: f32, beta: f32) -> Vec<f32> {
        self.reducer.reduce_noise(magnitude_spectrum, alpha, beta)
    }
}

#[wasm_bindgen]
pub fn compute_mel_filter_bank(
    n_mels: usize,
    n_fft: usize,
    sample_rate: usize,
    fmin: f32,
    fmax: f32,
) -> Vec<Vec<f32>> {
    utils::generate_mel_filter_bank(n_mels, n_fft, sample_rate, fmin, fmax)
}

#[wasm_bindgen]
pub fn hz_to_mel(hz: f32) -> f32 {
    utils::hz_to_mel(hz)
}

#[wasm_bindgen]
pub fn mel_to_hz(mel: f32) -> f32 {
    utils::mel_to_hz(mel)
}
