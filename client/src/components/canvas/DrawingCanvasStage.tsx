import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { useDrawingCanvas } from '../../hooks/useDrawingCanvas';
import { isDrawableTool, toolLabels } from '../../constants/drawing';
import type { BrushSettings, CanvasHistoryState, CanvasSize } from '../../types/drawing';
import type { SavedCanvasWork } from '../../types/storage';
import type { UploadedImage } from '../../types/upload';

const canvasSize: CanvasSize = {
  width: 1440,
  height: 960,
};

interface DrawingCanvasStageProps {
  brush: BrushSettings;
  onHistoryChange: (historyState: CanvasHistoryState) => void;
}

export interface DrawingCanvasStageHandle {
  clearCanvas: () => void;
  createThumbnail: () => string;
  exportImageDataUrl: () => string;
  loadSavedWork: (work: SavedCanvasWork) => Promise<void>;
  placeImage: (image: UploadedImage) => Promise<void>;
  redo: () => void;
  resetCanvas: () => void;
  undo: () => void;
}

export const DrawingCanvasStage = forwardRef<DrawingCanvasStageHandle, DrawingCanvasStageProps>(function DrawingCanvasStage(
  { brush, onHistoryChange },
  ref,
) {
  const {
    canvasRef,
    clearCanvas,
    createThumbnail,
    exportImageDataUrl,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    historyState,
    isDrawing,
    loadSavedWork,
    placeImage,
    redo,
    resetCanvas,
    strokeCount,
    undo,
  } = useDrawingCanvas({
    brush,
    size: canvasSize,
  });

  useImperativeHandle(
    ref,
    () => ({
      clearCanvas,
      createThumbnail,
      exportImageDataUrl,
      loadSavedWork,
      placeImage,
      redo,
      resetCanvas,
      undo,
    }),
    [clearCanvas, createThumbnail, exportImageDataUrl, loadSavedWork, placeImage, redo, resetCanvas, undo],
  );

  useEffect(() => {
    onHistoryChange(historyState);
  }, [historyState, onHistoryChange]);

  const canvasClassName = [
    'drawing-canvas',
    isDrawableTool(brush.tool) ? 'drawable' : 'not-drawable',
    brush.tool === 'eraser' ? 'eraser-cursor' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="canvas-stage" aria-label="드로잉 캔버스 영역">
      <div className="canvas-rulers" aria-hidden="true">
        <span>0</span>
        <span>480</span>
        <span>960</span>
        <span>1440</span>
      </div>
      <div className="canvas-scroll-plane">
        <div className={isDrawing ? 'canvas-frame drawing' : 'canvas-frame'}>
          <canvas
            aria-label="그림을 그릴 수 있는 HTML 캔버스"
            className={canvasClassName}
            onPointerCancel={handlePointerCancel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            ref={canvasRef}
          />
          <div className="canvas-overlay" aria-hidden="true">
            <span className="canvas-mark horizontal" />
            <span className="canvas-mark vertical" />
          </div>
        </div>
      </div>
      <p className="canvas-live-status" aria-live="polite">
        입력 상태: {isDrawing ? '그리는 중' : '대기'} / 현재 도구: {toolLabels[brush.tool]} / 작업 수:{' '}
        {strokeCount}
      </p>
    </section>
  );
});
