use rustfft::{FftPlanner, num_complex::Complex};
use rustfft::Fft;

#[derive(Clone, Copy, Debug)]
pub enum WindowType {
    Hann,
    Hamming,
    Blackman,
}

pub struct STFTProcessor {
    n_fft: usize,
    hop_length: usize,
    window: WindowType,
    window_func: Vec<f32>,
    fft: std::sync::Arc<dyn Fft<f32>>,
}

impl STFTProcessor {
    pub fn new(n_fft: usize, hop_length: usize, window: WindowType) -> Self {
        let window_func = Self::generate_window(n_fft, window);
        let mut planner = FftPlanner::new();
        let fft = planner.plan_fft_forward(n_fft);

        Self {
            n_fft,
            hop_length,
            window,
            window_func,
            fft,
        }
    }

    fn generate_window(n_fft: usize, window_type: WindowType) -> Vec<f32> {
        match window_type {
            WindowType::Hann => {
                if n_fft == 1 {
                    return vec![1.0];
                }
                (0..n_fft)
                    .map(|i| {
                        // SciPy-compatible Hann window: 0.5 * (1 - cos(2*pi*i/(n-1)))
                        let n_minus_1 = (n_fft - 1) as f32;
                        0.5 * (1.0 - (2.0 * std::f32::consts::PI * i as f32 / n_minus_1).cos())
                    })
                    .collect()
            },
            WindowType::Hamming => (0..n_fft)
                .map(|i| {
                    0.54 - 0.46 * (2.0 * std::f32::consts::PI * i as f32 / (n_fft - 1) as f32).cos()
                })
                .collect(),
            WindowType::Blackman => (0..n_fft)
                .map(|i| {
                    let a0 = 0.42;
                    let a1 = 0.5;
                    let a2 = 0.08;
                    let n = (n_fft - 1) as f32;
                    a0 - a1 * (2.0 * std::f32::consts::PI * i as f32 / n).cos()
                        + a2 * (4.0 * std::f32::consts::PI * i as f32 / n).cos()
                })
                .collect(),
        }
    }

    pub fn process(&self, audio_data: &[f32], _sample_rate: usize) -> Vec<f32> {
        if audio_data.is_empty() {
            return Vec::new();
        }

        let n_frames = (audio_data.len() + self.hop_length - 1) / self.hop_length;
        let n_bins = self.n_fft / 2 + 1;
        let mut output = Vec::with_capacity(n_frames * n_bins);

        for frame_start in (0..audio_data.len()).step_by(self.hop_length) {
            let frame_end = (frame_start + self.n_fft).min(audio_data.len());
            let mut frame = vec![Complex::default(); self.n_fft];

            for i in 0..(frame_end - frame_start) {
                frame[i] = Complex::new(
                    audio_data[frame_start + i] * self.window_func[i],
                    0.0,
                );
            }

            let mut spectrum = frame;
            let mut scratch = vec![Complex::default(); self.fft.get_inplace_scratch_len()];
            self.fft.process_with_scratch(&mut spectrum, &mut scratch);

            for bin in 0..n_bins {
                let magnitude = spectrum[bin].norm();
                output.push(magnitude);
            }
        }

        output
    }

    pub fn to_db(&self, magnitude_spectrum: &[f32], ref_db: f32, top_db: f32, min_db: f32, max_db: f32) -> Vec<f32> {
        // Calculate reference value: if ref_db is 0.0, use maximum magnitude as reference
        let max_magnitude = magnitude_spectrum.iter().fold(0.0f32, |a, &b| a.max(b));
        let ref_value = if ref_db == 0.0 {
            if max_magnitude > 0.0 {
                max_magnitude
            } else {
                1.0
            }
        } else {
            10.0f32.powf(ref_db / 20.0)
        };
        
        magnitude_spectrum
            .iter()
            .map(|&magnitude| {
                let db = if magnitude > 0.0 {
                    20.0 * (magnitude / ref_value).log10()
                } else {
                    min_db
                };
                // Apply top_db clipping: clip values that are more than top_db below the reference
                let clipped_db = if ref_db == 0.0 {
                    // When using max as reference, clip values more than top_db below max
                    let max_db_value = if max_magnitude > 0.0 {
                        20.0 * max_magnitude.log10()
                    } else {
                        max_db
                    };
                    db.max(max_db_value - top_db).min(max_db).max(min_db)
                } else {
                    // When using explicit ref_db, clip values more than top_db below ref_db
                    db.max(ref_db - top_db).min(max_db).max(min_db)
                };
                clipped_db
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stft_sine_wave() {
        let sample_rate = 44100;
        let frequency = 440.0;
        let duration = 1.0;
        let n_samples = (sample_rate as f32 * duration) as usize;
        
        let mut audio_data = Vec::with_capacity(n_samples);
        for i in 0..n_samples {
            let t = i as f32 / sample_rate as f32;
            audio_data.push((2.0 * std::f32::consts::PI * frequency * t).sin());
        }

        let processor = STFTProcessor::new(2048, 512, WindowType::Hann);
        let spectrum = processor.process(&audio_data, sample_rate);
        
        let n_bins = 2048 / 2 + 1;
        assert_eq!(spectrum.len() % n_bins, 0);
        
        let first_frame = &spectrum[0..n_bins];
        let peak_bin = first_frame
            .iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
            .map(|(i, _)| i)
            .unwrap();
        
        let peak_frequency = peak_bin as f32 * sample_rate as f32 / 2048.0;
        assert!((peak_frequency - frequency).abs() < 50.0);
    }

    #[test]
    fn test_window_generation() {
        let n_fft = 1024;
        let hann = STFTProcessor::generate_window(n_fft, WindowType::Hann);
        assert_eq!(hann.len(), n_fft);
        assert!((hann[0]).abs() < 0.001);
        assert!((hann[n_fft / 2] - 1.0).abs() < 0.1);
        assert!((hann[n_fft - 1]).abs() < 0.001);
    }
}
