pub fn mel_to_hz(mel: f32) -> f32 {
    700.0 * (10_f32.powf(mel / 2595.0) - 1.0)
}

pub fn hz_to_mel(hz: f32) -> f32 {
    2595.0 * (1.0 + hz / 700.0).log10()
}

pub fn generate_mel_filter_bank(
    n_mels: usize,
    n_fft: usize,
    sample_rate: usize,
    fmin: f32,
    fmax: f32,
) -> Vec<Vec<f32>> {
    let mut filter_bank = Vec::with_capacity(n_mels);

    let mel_min = hz_to_mel(fmin);
    let mel_max = hz_to_mel(fmax);
    let mel_points = (0..=n_mels + 1)
        .map(|i| {
            mel_min + (mel_max - mel_min) * i as f32 / (n_mels + 1) as f32
        })
        .collect::<Vec<_>>();
    let hz_points: Vec<f32> = mel_points.iter().map(|&m| mel_to_hz(m)).collect();
    let bin_points: Vec<usize> = hz_points
        .iter()
        .map(|&hz| ((hz / sample_rate as f32) * n_fft as f32).floor() as usize)
        .collect();

    for i in 0..n_mels {
        let mut filter = vec![0.0; n_fft / 2 + 1];
        let left = bin_points[i];
        let center = bin_points[i + 1];
        let right = bin_points[i + 2];

        for bin in left..center {
            if bin < filter.len() {
                filter[bin] = (bin - left) as f32 / (center - left) as f32;
            }
        }

        for bin in center..right.min(filter.len()) {
            filter[bin] = 1.0 - (bin - center) as f32 / (right - center) as f32;
        }

        filter_bank.push(filter);
    }

    filter_bank
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mel_conversion() {
        let hz = 1000.0;
        let mel = hz_to_mel(hz);
        let hz_back = mel_to_hz(mel);
        assert!((hz - hz_back).abs() < 1.0);
    }

    #[test]
    fn test_mel_filter_bank() {
        let filter_bank = generate_mel_filter_bank(10, 2048, 44100, 0.0, 22050.0);
        assert_eq!(filter_bank.len(), 10);
        assert_eq!(filter_bank[0].len(), 2048 / 2 + 1);
    }
}
