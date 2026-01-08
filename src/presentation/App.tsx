import React, { useState, useCallback, useRef } from 'react';
import { SpectrogramView } from './components/SpectrogramView/SpectrogramView';
import { ControlsPanel } from './components/ControlsPanel/ControlsPanel';
import { AnnotationEditor } from './components/AnnotationEditor/AnnotationEditor';
import { ExportDialog } from './components/ExportDialog/ExportDialog';
import { useAudioProcessing } from './hooks/useAudioProcessing';
import { FileAudioInput } from '@infrastructure/audio/FileAudioInput';
import { STFTParameters } from '@domain/interfaces/ISTFTProcessor';
import { RenderOptions } from '@domain/interfaces/IRenderer';
import './App.css';

function App() {
  const { audioBuffer, spectrogram, isProcessing, error, loadAudio, processAudio, isReady } =
    useAudioProcessing();
  const [renderOptions, setRenderOptions] = useState<RenderOptions>({
    colormap: 'viridis',
    brightness: 1.0,
    contrast: 1.0,
    gamma: 1.0,
    showAxes: true,
    showColorbar: true,
    dbMin: -80,
    dbMax: 0,
  });

  const [stftParams, setSTFTParams] = useState<STFTParameters>({
    nFft: 2048,
    hopLength: 512,
    windowType: 'hann',
    magnitudeType: 'magnitude',
    dbMin: -80,
    dbMax: 0,
  });

  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const fileInput = new FileAudioInput();
      fileInput.setFile(file);

      try {
        await loadAudio(fileInput);
      } catch (err) {
        console.error('Failed to load audio:', err);
      }
    },
    [loadAudio]
  );

  const handleRecompute = useCallback(async () => {
    if (!audioBuffer) return;

    try {
      await processAudio(stftParams);
    } catch (err) {
      console.error('Failed to process audio:', err);
    }
  }, [audioBuffer, stftParams, processAudio]);

  const handleSTFTParamsChange = useCallback((params: Partial<STFTParameters>) => {
    setSTFTParams((prev) => ({ ...prev, ...params }));
  }, []);

  const handleRenderOptionsChange = useCallback((options: Partial<RenderOptions>) => {
    setRenderOptions((prev) => ({ ...prev, ...options }));
  }, []);

  React.useEffect(() => {
    if (audioBuffer && !spectrogram && isReady) {
      handleRecompute();
    }
  }, [audioBuffer, spectrogram, isReady, handleRecompute]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Spectrogram Generator</h1>
        <div className="header-actions">
          <label className="upload-button">
            Upload WAV File
            <input
              type="file"
              accept=".wav,audio/wav"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={() => setShowExportDialog(true)}>Export</button>
        </div>
      </header>

      <div className="app-content">
        <ControlsPanel
          stftParams={stftParams}
          renderOptions={renderOptions}
          onSTFTParamsChange={handleSTFTParamsChange}
          onRenderOptionsChange={handleRenderOptionsChange}
          onRecompute={handleRecompute}
        />

        <div className="main-view">
          {error && <div className="error-message">Error: {error}</div>}
          {isProcessing && <div className="processing-message">Processing...</div>}

          {spectrogram ? (
            <SpectrogramView
              spectrogram={spectrogram}
              renderOptions={renderOptions}
            />
          ) : (
            <div className="empty-state">
              <p>Upload a WAV file to get started</p>
            </div>
          )}
        </div>

        <AnnotationEditor />
      </div>

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        exportService={null}
      />
    </div>
  );
}

export default App;
