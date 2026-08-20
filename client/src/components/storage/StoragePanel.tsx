import { Download, FolderOpen, RefreshCw, Save, Trash2 } from 'lucide-react';
import type { CanvasStorageState, SavedCanvasWork } from '../../types/storage';

const formatSavedTime = (isoDate: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(isoDate));

interface StoragePanelProps {
  activeWorkId: string | null;
  onDeleteWork: (workId: string) => void;
  onDownloadPng: () => void;
  onLoadWork: (work: SavedCanvasWork) => void;
  onSaveWork: () => void;
  storageState: CanvasStorageState;
}

export function StoragePanel({
  activeWorkId,
  onDeleteWork,
  onDownloadPng,
  onLoadWork,
  onSaveWork,
  storageState,
}: StoragePanelProps) {
  return (
    <section className="panel-block storage-panel" aria-labelledby="storage-title">
      <h2 id="storage-title">저장</h2>
      <div className="storage-mode" aria-label="저장 위치 선택">
        <button
          className={storageState.mode === 'local' ? 'active' : ''}
          onClick={() => storageState.setMode('local')}
          type="button"
        >
          브라우저
        </button>
        <button
          className={storageState.mode === 'remote' ? 'active' : ''}
          onClick={() => storageState.setMode('remote')}
          type="button"
        >
          서버
        </button>
      </div>
      {activeWorkId && <p className="storage-note">현재 선택한 저장본에 덮어씁니다.</p>}
      <div className="storage-actions">
        <button className="panel-action" disabled={storageState.isLoading} onClick={onSaveWork} type="button">
          <Save aria-hidden="true" size={16} strokeWidth={2.1} />
          {storageState.mode === 'remote' ? '서버에 저장' : '현재 작업 저장'}
        </button>
        <button className="panel-action secondary" disabled={storageState.isLoading} onClick={storageState.refreshSavedWorks} type="button">
          <RefreshCw aria-hidden="true" size={16} strokeWidth={2.1} />
          목록 새로고침
        </button>
        <button className="panel-action secondary" onClick={onDownloadPng} type="button">
          <Download aria-hidden="true" size={16} strokeWidth={2.1} />
          PNG 다운로드
        </button>
      </div>
      {storageState.isLoading && <div className="empty-list">저장소와 통신 중입니다.</div>}
      {storageState.errorMessage && (
        <div className="upload-error" role="alert">
          <span>{storageState.errorMessage}</span>
          <button aria-label="저장 오류 메시지 닫기" onClick={() => storageState.setErrorMessage('')} type="button">
            닫기
          </button>
        </div>
      )}
      {storageState.savedWorks.length === 0 ? (
        <div className="empty-list">저장한 작업이 없습니다.</div>
      ) : (
        <div className="saved-work-list" aria-label="저장 작업 목록">
          {storageState.savedWorks.map((work) => (
            <article className={activeWorkId === work.id ? 'saved-work active' : 'saved-work'} key={work.id}>
              <img alt="" src={work.thumbnailDataUrl} />
              <div className="saved-work-body">
                <strong>{work.name}</strong>
                <span>{formatSavedTime(work.updatedAt)}</span>
                <small>
                  {work.canvasSize.width} x {work.canvasSize.height}px
                </small>
              </div>
              <div className="saved-work-actions">
                <button disabled={storageState.isLoading} aria-label={`${work.name} 불러오기`} onClick={() => onLoadWork(work)} type="button">
                  <FolderOpen aria-hidden="true" size={15} strokeWidth={2.1} />
                </button>
                <button disabled={storageState.isLoading} aria-label={`${work.name} 삭제`} onClick={() => onDeleteWork(work.id)} type="button">
                  <Trash2 aria-hidden="true" size={15} strokeWidth={2.1} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
