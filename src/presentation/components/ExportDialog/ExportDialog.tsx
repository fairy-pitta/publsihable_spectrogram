import React, { useState } from 'react';
import { ExportService } from '@application/services/ExportService';
import './ExportDialog.css';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exportService?: ExportService | null;
}

export function ExportDialog({ isOpen, onClose, exportService }: ExportDialogProps) {

  const [filename, setFilename] = useState('spectrogram');
  const [dpi, setDpi] = useState(300);
  const [exportFormat, setExportFormat] = useState<'png' | 'svg'>('png');

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!exportService) {
      alert('Export service not available');
      return;
    }

    try {
      if (exportFormat === 'png') {
        await exportService.downloadPNG(`${filename}.png`, dpi);
      } else {
        exportService.downloadSVG(`${filename}.svg`);
      }
      onClose();
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Export Spectrogram</h2>

        <div className="export-form">
          <label>
            Filename:
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
          </label>

          <label>
            Format:
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'png' | 'svg')}
            >
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
            </select>
          </label>

          {exportFormat === 'png' && (
            <label>
              DPI:
              <select value={dpi} onChange={(e) => setDpi(parseInt(e.target.value))}>
                <option value={150}>150 (Screen)</option>
                <option value={300}>300 (Print)</option>
                <option value={600}>600 (High Quality)</option>
              </select>
            </label>
          )}

          <div className="export-buttons">
            <button onClick={handleExport}>Export</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
