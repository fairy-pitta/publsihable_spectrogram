pub struct SpectralSubtraction {
    noise_spectrum: Vec<f32>,
}

impl SpectralSubtraction {
    pub fn new() -> Self {
        Self {
            noise_spectrum: Vec::new(),
        }
    }

    pub fn estimate_noise(&mut self, noise_segment: &[f32]) {
        if noise_segment.is_empty() {
            return;
        }

        self.noise_spectrum = noise_segment.to_vec();
    }

    pub fn reduce_noise(&self, magnitude_spectrum: &[f32], alpha: f32, beta: f32) -> Vec<f32> {
        if self.noise_spectrum.is_empty() || self.noise_spectrum.len() != magnitude_spectrum.len() {
            return magnitude_spectrum.to_vec();
        }

        magnitude_spectrum
            .iter()
            .zip(self.noise_spectrum.iter())
            .map(|(&signal, &noise)| {
                let subtracted = signal - alpha * noise;
                if subtracted > beta * noise {
                    subtracted
                } else {
                    beta * noise
                }
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spectral_subtraction() {
        let mut reducer = SpectralSubtraction::new();
        let noise = vec![0.1, 0.1, 0.1, 0.1];
        reducer.estimate_noise(&noise);

        let signal = vec![0.5, 0.3, 0.1, 0.05];
        let reduced = reducer.reduce_noise(&signal, 1.0, 0.1);

        assert_eq!(reduced.len(), signal.len());
        assert!(reduced[0] > 0.0);
    }
}

