import React from 'react';
import { STFTParameters } from '@domain/interfaces/ISTFTProcessor';
import { RenderOptions } from '@domain/interfaces/IRenderer';
import './ControlsPanel.css';

interface ControlsPanelProps {
  stftParams: STFTParameters;
  renderOptions: RenderOptions;
  onSTFTParamsChange: (params: Partial<STFTParameters>) => void;
  onRenderOptionsChange: (options: Partial<RenderOptions>) => void;
  onRecompute: () => void;
}

export function ControlsPanel({
  stftParams,
  renderOptions,
  onSTFTParamsChange,
  onRenderOptionsChange,
  onRecompute,
}: ControlsPanelProps) {
  return (
    <div className="controls-panel">
      <h2>STFT Parameters</h2>
      <div className="control-group">
        <label>
          n_fft:
          <select
            value={stftParams.nFft}
            onChange={(e) => onSTFTParamsChange({ nFft: parseInt(e.target.value) })}
          >
            <option value={512}>512</option>
            <option value={1024}>1024</option>
            <option value={2048}>2048</option>
            <option value={4096}>4096</option>
          </select>
        </label>

        <label>
          hop_length:
          <input
            type="number"
            value={stftParams.hopLength}
            onChange={(e) => onSTFTParamsChange({ hopLength: parseInt(e.target.value) })}
            min={64}
            max={4096}
            step={64}
          />
        </label>

        <label>
          Window:
          <select
            value={stftParams.windowType}
            onChange={(e) => onSTFTParamsChange({ windowType: e.target.value as any })}
          >
            <option value="hann">Hann</option>
            <option value="hamming">Hamming</option>
            <option value="blackman">Blackman</option>
          </select>
        </label>

        <label>
          Magnitude Type:
          <select
            value={stftParams.magnitudeType}
            onChange={(e) => onSTFTParamsChange({ magnitudeType: e.target.value as any })}
          >
            <option value="magnitude">Magnitude</option>
            <option value="power">Power</option>
          </select>
        </label>

        <label>
          dB Min:
          <input
            type="number"
            value={stftParams.dbMin}
            onChange={(e) => onSTFTParamsChange({ dbMin: parseFloat(e.target.value) })}
            min={-120}
            max={0}
            step={5}
          />
        </label>

        <label>
          dB Max:
          <input
            type="number"
            value={stftParams.dbMax}
            onChange={(e) => onSTFTParamsChange({ dbMax: parseFloat(e.target.value) })}
            min={-120}
            max={0}
            step={5}
          />
        </label>
      </div>

      <button onClick={onRecompute} className="recompute-button">
        Recompute
      </button>

      <h2>Display Options</h2>
      <div className="control-group">
        <label>
          Colormap:
          <select
            value={renderOptions.colormap}
            onChange={(e) => onRenderOptionsChange({ colormap: e.target.value as any })}
          >
            <option value="viridis">Viridis</option>
            <option value="magma">Magma</option>
            <option value="grayscale">Grayscale</option>
          </select>
        </label>

        <label>
          Brightness:
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={renderOptions.brightness}
            onChange={(e) => onRenderOptionsChange({ brightness: parseFloat(e.target.value) })}
          />
          <span>{renderOptions.brightness.toFixed(1)}</span>
        </label>

        <label>
          Contrast:
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={renderOptions.contrast}
            onChange={(e) => onRenderOptionsChange({ contrast: parseFloat(e.target.value) })}
          />
          <span>{renderOptions.contrast.toFixed(1)}</span>
        </label>

        <label>
          Gamma:
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={renderOptions.gamma}
            onChange={(e) => onRenderOptionsChange({ gamma: parseFloat(e.target.value) })}
          />
          <span>{renderOptions.gamma.toFixed(1)}</span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={renderOptions.showAxes}
            onChange={(e) => onRenderOptionsChange({ showAxes: e.target.checked })}
          />
          Show Axes
        </label>

        <label>
          <input
            type="checkbox"
            checked={renderOptions.showColorbar}
            onChange={(e) => onRenderOptionsChange({ showColorbar: e.target.checked })}
          />
          Show Colorbar
        </label>
      </div>
    </div>
  );
}
