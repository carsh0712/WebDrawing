import { FolderOpen, Monitor, Plus, RefreshCw, Server, Trash2 } from 'lucide-react';
import type { CanvasStorageMode, SavedCanvasWork } from '../../types/storage';

const formatSavedTime = (isoDate: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoDate));

interface GalleryViewProps {
  isLoading: boolean;
  mode: CanvasStorageMode;
  savedWorks: SavedCanvasWork[];
  errorMessage: string;
  onDeleteWork: (workId: string) => void;
  onLoadWork: (work: SavedCanvasWork) => void;
  onModeChange: (mode: CanvasStorageMode) => void;
  onNewCanvas: () => void;
  onRefresh: () => void;
  onClearError: () => void;
}

export function GalleryView({
  errorMessage,
  isLoading,
  mode,
  onClearError,
  onDeleteWork,
  onLoadWork,
  onModeChange,
  onNewCanvas,
  onRefresh,
  savedWorks,
}: GalleryViewProps) {
  return (
    <main className="gallery-view" aria-labelledby="gallery-title">
      <section className="gallery-toolbar">
        <div>
          <p className="eyebrow">WebDrawingCanvas</p>
          <h1 id="gallery-title">갤러리</h1>
        </div>
        <div className="gallery-actions" aria-label="갤러리 작업">
          <div className="gallery-mode" aria-label="갤러리 위치 선택">
            <button className={mode === 'local' ? 'active' : ''} onClick={() => onModeChange('local')} type="button">
              <Monitor aria-hidden="true" size={16} strokeWidth={2.1} />
              브라우저
            </button>
            <button className={mode === 'remote' ? 'active' : ''} onClick={() => onModeChange('remote')} type="button">
              <Server aria-hidden="true" size={16} strokeWidth={2.1} />
              서버
            </button>
          </div>
          <button className="gallery-icon-button" disabled={isLoading} onClick={onRefresh} type="button">
            <RefreshCw aria-hidden="true" size={17} strokeWidth={2.1} />
            새로고침
          </button>
          <button className="gallery-primary-button" onClick={onNewCanvas} type="button">
            <Plus aria-hidden="true" size={18} strokeWidth={2.2} />새 그림
          </button>
        </div>
      </section>

      {errorMessage && (
        <div className="gallery-error" role="alert">
          <span>{errorMessage}</span>
          <button aria-label="갤러리 오류 메시지 닫기" onClick={onClearError} type="button">
            닫기
          </button>
        </div>
      )}

      {isLoading && <div className="gallery-empty">갤러리 정보를 불러오는 중입니다.</div>}

      {!isLoading && savedWorks.length === 0 ? (
        <section className="gallery-empty">
          <strong>{mode === 'remote' ? '서버에 저장된 그림이 없습니다.' : '브라우저에 저장된 그림이 없습니다.'}</strong>
          <span>새 그림을 시작하면 빈 캔버스에서 바로 그릴 수 있습니다.</span>
        </section>
      ) : (
        <section className="gallery-grid" aria-label={`${mode === 'remote' ? '서버' : '브라우저'} 갤러리 목록`}>
          {savedWorks.map((work) => (
            <article className="gallery-card" key={work.id}>
              <button className="gallery-card-preview" onClick={() => onLoadWork(work)} type="button">
                {work.thumbnailDataUrl ? <img alt="" src={work.thumbnailDataUrl} /> : <span>미리보기 없음</span>}
              </button>
              <div className="gallery-card-body">
                <div className="gallery-card-title-row">
                  <h2 title={work.name}>{work.name}</h2>
                  <span>{mode === 'remote' ? '서버' : '브라우저'}</span>
                </div>
                <dl className="gallery-card-meta">
                  <div>
                    <dt>수정</dt>
                    <dd>{formatSavedTime(work.updatedAt)}</dd>
                  </div>
                  <div>
                    <dt>크기</dt>
                    <dd>
                      {work.canvasSize.width} x {work.canvasSize.height}px
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="gallery-card-actions">
                <button disabled={isLoading} onClick={() => onLoadWork(work)} type="button">
                  <FolderOpen aria-hidden="true" size={16} strokeWidth={2.1} />
                  열기
                </button>
                <button disabled={isLoading} onClick={() => onDeleteWork(work.id)} type="button">
                  <Trash2 aria-hidden="true" size={16} strokeWidth={2.1} />
                  삭제
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
