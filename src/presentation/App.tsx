import React, { useState, useCallback, useRef } from 'react';
import { SpectrogramView } from './components/SpectrogramView/SpectrogramView';
import { ControlsPanel } from './components/ControlsPanel/ControlsPanel';
import { AnnotationEditor } from './components/AnnotationEditor/AnnotationEditor';
import { ExportDialog } from './components/ExportDialog/ExportDialog';
import { useAudioProcessing } from './hooks/useAudioProcessing';
import { FileAudioInput } from '@infrastructure/audio/FileAudioInput';
import { STFTParameters } from '@domain/interfaces/ISTFTProcessor';
import { RenderOptions } from '@domain/interfaces/IRenderer';
import { AnnotationService } from '@application/services/AnnotationService';
import { Annotation } from '@domain/entities/Annotation';
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
    smoothing: 0.0,
    oversampling: false,
  });

  const [stftParams, setSTFTParams] = useState<STFTParameters>({
    nFft: 2048,
    hopLength: 512, // 2048 / 4 = 512
    windowType: 'hann',
    magnitudeType: 'magnitude',
    dbMin: -80,
    dbMax: 0,
    refDb: 0.0, // 0.0 means use maximum as reference
    topDb: 80.0, // Default top_db is 80
  });

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [annotationService, setAnnotationService] = useState<AnnotationService | null>(null);
  const [addAnnotation, setAddAnnotation] = useState<((annotation: Annotation) => void) | null>(null);
  const [updateAnnotation, setUpdateAnnotation] = useState<((annotation: Annotation) => void) | null>(null);
  const [spectrogramCenter, setSpectrogramCenter] = useState<{ x: number; y: number } | null>(null);
  const [controlsPanelCollapsed, setControlsPanelCollapsed] = useState(false);
  const [annotationEditorCollapsed, setAnnotationEditorCollapsed] = useState(false);

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
    setSTFTParams((prev) => {
      const updated = { ...prev, ...params };
      // If nFft changed, automatically update hopLength to nFft / 4
      if (params.nFft !== undefined && params.hopLength === undefined) {
        updated.hopLength = Math.floor(params.nFft / 4);
      }
      return updated;
    });
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
            Upload Audio File
            <input
              type="file"
              accept=".wav,.mp3,.ogg,.m4a,audio/wav,audio/mpeg,audio/ogg,audio/mp4"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={() => setShowExportDialog(true)}>Export</button>
        </div>
      </header>

      <div className="app-content">
        <div className={`sidebar-left ${controlsPanelCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="sidebar-toggle"
            onClick={() => setControlsPanelCollapsed(!controlsPanelCollapsed)}
            title={controlsPanelCollapsed ? 'Expand Controls' : 'Collapse Controls'}
          >
            <i className={`fas ${controlsPanelCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
          {!controlsPanelCollapsed && (
            <ControlsPanel
              stftParams={stftParams}
              renderOptions={renderOptions}
              onSTFTParamsChange={handleSTFTParamsChange}
              onRenderOptionsChange={handleRenderOptionsChange}
              onRecompute={handleRecompute}
            />
          )}
        </div>

        <div className="main-view">
          {error && <div className="error-message">Error: {error}</div>}
          {isProcessing && <div className="processing-message">Processing...</div>}

          {spectrogram ? (
            <SpectrogramView
              spectrogram={spectrogram}
              renderOptions={renderOptions}
              onAnnotationServiceReady={setAnnotationService}
              onAddAnnotationReady={setAddAnnotation}
              onUpdateAnnotationReady={setUpdateAnnotation}
              onCenterReady={setSpectrogramCenter}
            />
          ) : (
            <div className="empty-state">
              <p>Upload an audio file to get started</p>
            </div>
          )}
        </div>

        <div className={`sidebar-right ${annotationEditorCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="sidebar-toggle"
            onClick={() => setAnnotationEditorCollapsed(!annotationEditorCollapsed)}
            title={annotationEditorCollapsed ? 'Expand Annotations' : 'Collapse Annotations'}
          >
            <i className={`fas ${annotationEditorCollapsed ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
          {!annotationEditorCollapsed && (
            <AnnotationEditor 
              annotationService={annotationService}
              addAnnotation={addAnnotation}
              updateAnnotation={updateAnnotation}
              spectrogramCenter={spectrogramCenter}
            />
          )}
        </div>
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
