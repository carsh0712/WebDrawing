import {
  Download,
  FileImage,
  FilePlus2,
  FolderOpen,
  Images,
  Redo2,
  Save,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface TopMenuBarProps {
  canRedo: boolean;
  canUndo: boolean;
  onClearCanvas: () => void;
  onDownloadPng: () => void;
  onOpenGallery: () => void;
  onNewCanvas: () => void;
  onOpenStorage: () => void;
  onRedo: () => void;
  onSaveWork: () => void;
  onUndo: () => void;
}

export function TopMenuBar({
  canRedo,
  canUndo,
  onClearCanvas,
  onDownloadPng,
  onOpenGallery,
  onNewCanvas,
  onOpenStorage,
  onRedo,
  onSaveWork,
  onUndo,
}: TopMenuBarProps) {
  const menuActions = [
    { label: '갤러리', icon: Images, onClick: onOpenGallery },
    { label: '새 캔버스', icon: FilePlus2, onClick: onNewCanvas },
    { label: '열기', icon: FolderOpen, onClick: onOpenStorage },
    { label: '저장', icon: Save, onClick: onSaveWork },
    { label: '이미지 삽입', icon: FileImage },
    { disabled: !canUndo, label: '실행 취소', icon: Undo2, onClick: onUndo },
    { disabled: !canRedo, label: '다시 실행', icon: Redo2, onClick: onRedo },
    { label: '전체 지우기', icon: Trash2, onClick: onClearCanvas },
    { label: 'PNG 다운로드', icon: Download, onClick: onDownloadPng },
  ];

  return (
    <header className="top-menu">
      <div>
        <p className="eyebrow">WebDrawingCanvas</p>
        <h1>드로잉 MVP 작업대</h1>
      </div>
      <div className="top-menu-controls">
        <nav className="menu-actions" aria-label="빠른 작업">
          {menuActions.map(({ disabled = false, label, icon: Icon, onClick }) => (
            <button
              aria-disabled={disabled}
              className="icon-button"
              disabled={disabled}
              key={label}
              onClick={onClick}
              type="button"
              aria-label={label}
              title={label}
            >
              <Icon aria-hidden="true" size={19} strokeWidth={2.1} />
            </button>
          ))}
        </nav>
        <div className="zoom-control" aria-label="확대와 축소">
          <button className="icon-button compact" type="button" aria-label="축소" title="축소">
            <ZoomOut aria-hidden="true" size={18} strokeWidth={2.1} />
          </button>
          <output aria-label="현재 확대 비율">100%</output>
          <button className="icon-button compact" type="button" aria-label="확대" title="확대">
            <ZoomIn aria-hidden="true" size={18} strokeWidth={2.1} />
          </button>
        </div>
      </div>
    </header>
  );
}
