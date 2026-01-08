import React, { useState, useCallback } from 'react';
import { SpectrogramView } from './components/SpectrogramView/SpectrogramView';
import { ControlsPanel } from './components/ControlsPanel/ControlsPanel';
import { AnnotationEditor } from './components/AnnotationEditor/AnnotationEditor';
import { ExportDialog } from './components/ExportDialog/ExportDialog';
import { useAudioProcessing } from './hooks/useAudioProcessing';
import { AudioInputFactory } from '@infrastructure/factories/AudioInputFactory';
import { STFTParameters } from '@domain/interfaces/ISTFTProcessor';
import { RenderOptions } from '@domain/interfaces/IRenderer';
import { AnnotationService } from '@application/services/AnnotationService';
import { ExportService } from '@application/services/ExportService';
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
    timeMin: undefined,
    timeMax: undefined,
    freqMin: undefined,
    freqMax: undefined,
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
  const [exportService, setExportService] = useState<ExportService | null>(null);
  const [addAnnotation, setAddAnnotation] = useState<((annotation: Annotation) => void) | null>(null);
  const [updateAnnotation, setUpdateAnnotation] = useState<((annotation: Annotation) => void) | null>(null);
  const [spectrogramCenter, setSpectrogramCenter] = useState<{ x: number; y: number } | null>(null);
  const [controlsPanelCollapsed, setControlsPanelCollapsed] = useState(false);
  const [annotationEditorCollapsed, setAnnotationEditorCollapsed] = useState(false);

  // Mobile-first: start with panels collapsed on small screens.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 900px)');
    if (mq.matches) {
      setControlsPanelCollapsed(true);
      setAnnotationEditorCollapsed(true);
    }
  }, []);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const fileInput = AudioInputFactory.createFileInput(file);

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
              className="file-input-hidden"
            />
          </label>
          <button onClick={() => setShowExportDialog(true)}>Export</button>
        </div>
      </header>

      <div className="app-content">
        <div className="sidebar-container-left">
          <button 
            className="sidebar-toggle sidebar-toggle-left"
            onClick={() => setControlsPanelCollapsed(!controlsPanelCollapsed)}
            title={controlsPanelCollapsed ? 'Expand Controls' : 'Collapse Controls'}
          >
            <i className={`fas ${controlsPanelCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
          <div className={`sidebar-left ${controlsPanelCollapsed ? 'collapsed' : ''}`}>
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
        </div>

        <div className="main-view">
          {error && (
            <div className="error-message" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}
          {isProcessing && <div className="processing-message">Processing...</div>}

          {spectrogram ? (
            <SpectrogramView
              spectrogram={spectrogram}
              renderOptions={renderOptions}
              onAnnotationServiceReady={setAnnotationService}
              onExportServiceReady={setExportService}
              onAddAnnotationReady={setAddAnnotation}
              onUpdateAnnotationReady={setUpdateAnnotation}
              onCenterReady={setSpectrogramCenter}
            />
          ) : (
            <div className="empty-state">
              <i className="fas fa-music"></i>
              <p>Upload an audio file to get started</p>
            </div>
          )}
        </div>

        <div className="sidebar-container-right">
          <button 
            className="sidebar-toggle sidebar-toggle-right"
            onClick={() => setAnnotationEditorCollapsed(!annotationEditorCollapsed)}
            title={annotationEditorCollapsed ? 'Expand Annotations' : 'Collapse Annotations'}
          >
            <i className={`fas ${annotationEditorCollapsed ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
          <div className={`sidebar-right ${annotationEditorCollapsed ? 'collapsed' : ''}`}>
            {!annotationEditorCollapsed && (
              <AnnotationEditor 
                annotationService={annotationService ?? undefined}
                addAnnotation={addAnnotation ?? undefined}
                updateAnnotation={updateAnnotation ?? undefined}
                spectrogramCenter={spectrogramCenter ?? undefined}
              />
            )}
          </div>
        </div>
      </div>

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        exportService={exportService}
      />
    </div>
  );
}

export default App;
