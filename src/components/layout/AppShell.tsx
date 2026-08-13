import { useCallback, useRef, useState } from 'react';
import { defaultBrushSettings } from '../../constants/drawing';
import { useCanvasStorage } from '../../hooks/useCanvasStorage';
import { useImageUploads } from '../../hooks/useImageUploads';
import { downloadDataUrl } from '../../services/fileDownloadService';
import type { BrushSettings, CanvasHistoryState, DrawingTool } from '../../types/drawing';
import type { SavedCanvasWork } from '../../types/storage';
import type { UploadedImage } from '../../types/upload';
import { DrawingCanvasStage, type DrawingCanvasStageHandle } from '../canvas/DrawingCanvasStage';
import { RightPanel } from '../panels/RightPanel';
import { ToolBarPlaceholder } from '../tools/ToolBarPlaceholder';
import { ConfirmDialog } from './ConfirmDialog';
import { StatusBar } from './StatusBar';
import { TopMenuBar } from './TopMenuBar';

type PendingCanvasAction = 'clear' | 'new' | null;
type PanelTab = 'properties' | 'uploads' | 'storage' | 'canvas';

export function AppShell() {
  const canvasStageRef = useRef<DrawingCanvasStageHandle | null>(null);
  const storageState = useCanvasStorage();
  const uploadState = useImageUploads();
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>('properties');
  const [brush, setBrush] = useState<BrushSettings>(defaultBrushSettings);
  const [historyState, setHistoryState] = useState<CanvasHistoryState>({
    canRedo: false,
    canUndo: false,
    hasChanges: false,
    redoCount: 0,
    undoCount: 0,
  });
  const [pendingCanvasAction, setPendingCanvasAction] = useState<PendingCanvasAction>(null);

  const updateBrush = (nextBrush: Partial<BrushSettings>) => {
    setBrush((currentBrush) => ({
      ...currentBrush,
      ...nextBrush,
    }));
  };

  const handleToolSelect = (tool: DrawingTool) => {
    setBrush((currentBrush) => ({
      ...currentBrush,
      opacity:
        tool === 'eraser'
          ? 100
          : tool === 'brush' && currentBrush.tool !== 'brush'
            ? Math.min(currentBrush.opacity, 72)
            : currentBrush.opacity,
      size:
        tool === 'brush' && currentBrush.tool !== 'brush'
          ? Math.max(currentBrush.size, 34)
          : tool === 'eraser' && currentBrush.size < 18
            ? 28
            : currentBrush.size,
      tool,
    }));
  };

  const handleHistoryChange = useCallback((nextHistoryState: CanvasHistoryState) => {
    setHistoryState(nextHistoryState);
  }, []);

  const requestCanvasAction = (action: Exclude<PendingCanvasAction, null>) => {
    if (historyState.hasChanges) {
      setPendingCanvasAction(action);
      return;
    }

    if (action === 'clear') {
      canvasStageRef.current?.clearCanvas();
    } else {
      canvasStageRef.current?.resetCanvas();
    }
  };

  const confirmCanvasAction = () => {
    if (pendingCanvasAction === 'clear') {
      canvasStageRef.current?.clearCanvas();
    }

    if (pendingCanvasAction === 'new') {
      canvasStageRef.current?.resetCanvas();
    }

    setPendingCanvasAction(null);
  };

  const handlePlaceImage = (image: UploadedImage) => {
    void canvasStageRef.current?.placeImage(image).catch((error: unknown) => {
      uploadState.setErrorMessage(error instanceof Error ? error.message : '선택한 이미지를 배치할 수 없습니다.');
    });
  };

  const createDefaultWorkName = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5).replace(':', '');
    return `WebDrawingCanvas ${date} ${time}`;
  };

  const handleSaveWork = () => {
    const imageDataUrl = canvasStageRef.current?.exportImageDataUrl();
    const thumbnailDataUrl = canvasStageRef.current?.createThumbnail();

    if (!imageDataUrl || !thumbnailDataUrl) {
      storageState.setErrorMessage('저장할 캔버스 이미지를 만들 수 없습니다.');
      return;
    }

    try {
      const savedWork = storageState.saveCurrentWork(
        {
          canvasSize: {
            height: 960,
            width: 1440,
          },
          imageDataUrl,
          name: createDefaultWorkName(),
          thumbnailDataUrl,
        },
        activeWorkId,
      );
      setActiveWorkId(savedWork.id);
    } catch (error) {
      storageState.setErrorMessage(error instanceof Error ? error.message : '작업을 저장하지 못했습니다.');
    }
  };

  const handleLoadWork = (work: SavedCanvasWork) => {
    void canvasStageRef.current?.loadSavedWork(work).then(
      () => {
        setActiveWorkId(work.id);
      },
      (error: unknown) => {
        storageState.setErrorMessage(error instanceof Error ? error.message : '저장된 작업을 불러오지 못했습니다.');
      },
    );
  };

  const handleDeleteWork = (workId: string) => {
    const shouldDelete = window.confirm('저장된 작업을 삭제할까요? 이 작업은 되돌릴 수 없습니다.');

    if (!shouldDelete) {
      return;
    }

    storageState.deleteWork(workId);

    if (activeWorkId === workId) {
      setActiveWorkId(null);
    }
  };

  const handleDownloadPng = () => {
    const imageDataUrl = canvasStageRef.current?.exportImageDataUrl();

    if (!imageDataUrl) {
      storageState.setErrorMessage('다운로드할 캔버스 이미지를 만들 수 없습니다.');
      return;
    }

    downloadDataUrl(imageDataUrl, `${createDefaultWorkName().replaceAll(' ', '-')}.png`);
  };

  return (
    <div className="app-shell">
      <TopMenuBar
        canRedo={historyState.canRedo}
        canUndo={historyState.canUndo}
        onClearCanvas={() => requestCanvasAction('clear')}
        onDownloadPng={handleDownloadPng}
        onOpenStorage={() => setActivePanelTab('storage')}
        onNewCanvas={() => requestCanvasAction('new')}
        onRedo={() => canvasStageRef.current?.redo()}
        onSaveWork={handleSaveWork}
        onUndo={() => canvasStageRef.current?.undo()}
      />
      <div className="workspace">
        <ToolBarPlaceholder activeTool={brush.tool} onToolSelect={handleToolSelect} />
        <main className="canvas-workspace" aria-label="캔버스 작업 영역">
          <DrawingCanvasStage brush={brush} onHistoryChange={handleHistoryChange} ref={canvasStageRef} />
        </main>
        <RightPanel
          activeWorkId={activeWorkId}
          activeTab={activePanelTab}
          brush={brush}
          onBrushChange={updateBrush}
          onDeleteWork={handleDeleteWork}
          onDownloadPng={handleDownloadPng}
          onLoadWork={handleLoadWork}
          onPlaceImage={handlePlaceImage}
          onSaveWork={handleSaveWork}
          onTabChange={setActivePanelTab}
          storageState={storageState}
          uploadState={uploadState}
        />
      </div>
      <StatusBar brush={brush} historyState={historyState} />
      {pendingCanvasAction && (
        <ConfirmDialog
          body={
            pendingCanvasAction === 'clear'
              ? '현재 캔버스의 모든 그림을 지우고 이 작업을 이력에 기록합니다.'
              : '현재 작업 이력을 비우고 새 캔버스로 시작합니다.'
          }
          confirmLabel={pendingCanvasAction === 'clear' ? '전체 지우기' : '새 캔버스'}
          onCancel={() => setPendingCanvasAction(null)}
          onConfirm={confirmCanvasAction}
          title={pendingCanvasAction === 'clear' ? '캔버스를 지울까요?' : '새 캔버스를 시작할까요?'}
        />
      )}
    </div>
  );
}
