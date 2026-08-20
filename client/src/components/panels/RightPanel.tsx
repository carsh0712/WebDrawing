import { CanvasInfoPanelPlaceholder } from './CanvasInfoPanelPlaceholder';
import { PropertiesPanelPlaceholder } from './PropertiesPanelPlaceholder';
import { StoragePanel } from '../storage/StoragePanel';
import { UploadPanel } from '../uploads/UploadPanel';
import type { BrushSettings } from '../../types/drawing';
import type { CanvasStorageState, SavedCanvasWork } from '../../types/storage';
import type { ImageUploadState, UploadedImage } from '../../types/upload';

type PanelTab = 'properties' | 'uploads' | 'storage' | 'canvas';

const tabs: Array<{ id: PanelTab; label: string }> = [
  { id: 'properties', label: '속성' },
  { id: 'uploads', label: '업로드' },
  { id: 'storage', label: '저장' },
  { id: 'canvas', label: '정보' },
];

interface RightPanelProps {
  brush: BrushSettings;
  activeWorkId: string | null;
  activeTab: PanelTab;
  onBrushChange: (brush: Partial<BrushSettings>) => void;
  onDeleteWork: (workId: string) => void;
  onDownloadPng: () => void;
  onLoadWork: (work: SavedCanvasWork) => void;
  onPlaceImage: (image: UploadedImage) => void;
  onSaveWork: () => void;
  onTabChange: (tab: PanelTab) => void;
  storageState: CanvasStorageState;
  uploadState: ImageUploadState;
}

export function RightPanel({
  activeWorkId,
  activeTab,
  brush,
  onBrushChange,
  onDeleteWork,
  onDownloadPng,
  onLoadWork,
  onPlaceImage,
  onSaveWork,
  onTabChange,
  storageState,
  uploadState,
}: RightPanelProps) {
  return (
    <aside className="side-panel" aria-label="속성, 업로드, 저장 패널">
      <div className="panel-tabs" role="tablist" aria-label="우측 패널 탭">
        {tabs.map((tab) => (
          <button
            aria-controls={`${tab.id}-panel`}
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? 'panel-tab active' : 'panel-tab'}
            id={`${tab.id}-tab`}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        aria-labelledby={`${activeTab}-tab`}
        className="panel-content"
        id={`${activeTab}-panel`}
        role="tabpanel"
      >
        {activeTab === 'properties' && <PropertiesPanelPlaceholder brush={brush} onBrushChange={onBrushChange} />}
        {activeTab === 'uploads' && <UploadPanel onPlaceImage={onPlaceImage} uploadState={uploadState} />}
        {activeTab === 'storage' && (
          <StoragePanel
            activeWorkId={activeWorkId}
            onDeleteWork={onDeleteWork}
            onDownloadPng={onDownloadPng}
            onLoadWork={onLoadWork}
            onSaveWork={onSaveWork}
            storageState={storageState}
          />
        )}
        {activeTab === 'canvas' && <CanvasInfoPanelPlaceholder />}
      </div>
    </aside>
  );
}
