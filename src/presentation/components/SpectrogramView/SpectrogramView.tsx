import React, { useRef, useEffect, useState } from 'react';
import { Spectrogram } from '@domain/entities/Spectrogram';
import { useSpectrogram } from '../../hooks/useSpectrogram';
import { RenderOptions } from '@domain/interfaces/IRenderer';
import './SpectrogramView.css';

interface SpectrogramViewProps {
  spectrogram: Spectrogram | null;
  renderOptions: RenderOptions;
  onRender?: () => void;
}

export function SpectrogramView({ spectrogram, renderOptions, onRender }: SpectrogramViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { render } = useSpectrogram(canvasRef, svgRef);

  useEffect(() => {
    if (spectrogram && canvasRef.current && svgRef.current) {
      const updateCanvasSize = () => {
        if (canvasRef.current && svgRef.current) {
          canvasRef.current.width = canvasRef.current.offsetWidth;
          canvasRef.current.height = canvasRef.current.offsetHeight;
          svgRef.current.setAttribute('width', canvasRef.current.width.toString());
          svgRef.current.setAttribute('height', canvasRef.current.height.toString());
        }
      };

      updateCanvasSize();
      render(spectrogram, renderOptions);
      onRender?.();

      // Handle window resize
      window.addEventListener('resize', updateCanvasSize);
      return () => window.removeEventListener('resize', updateCanvasSize);
    }
  }, [spectrogram, renderOptions, render, onRender]);

  return (
    <div className="spectrogram-view">
      <div className="spectrogram-container">
        <canvas ref={canvasRef} className="spectrogram-canvas" />
        <svg ref={svgRef} className="spectrogram-annotations" />
      </div>
    </div>
  );
}
