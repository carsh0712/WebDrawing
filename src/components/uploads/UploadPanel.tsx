import { ImagePlus, Trash2 } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import { useId } from 'react';
import type { ImageUploadState, UploadedImage } from '../../types/upload';

const formatFileSize = (fileSize: number) => {
  if (fileSize < 1024 * 1024) {
    return `${Math.ceil(fileSize / 1024)}KB`;
  }

  return `${(fileSize / 1024 / 1024).toFixed(1)}MB`;
};

interface UploadPanelProps {
  onPlaceImage: (image: UploadedImage) => void;
  uploadState: ImageUploadState;
}

export function UploadPanel({ onPlaceImage, uploadState }: UploadPanelProps) {
  const inputId = useId();
  const {
    addFiles,
    errorMessage,
    images,
    isDragging,
    removeImage,
    selectedImage,
    selectedImageId,
    setErrorMessage,
    setIsDragging,
    setSelectedImageId,
  } = uploadState;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      void addFiles(event.target.files);
    }

    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files.length > 0) {
      void addFiles(event.dataTransfer.files);
    }
  };

  return (
    <section className="panel-block upload-panel" aria-labelledby="uploads-title">
      <h2 id="uploads-title">업로드</h2>
      <input
        accept="image/png,image/jpeg,image/webp"
        className="visually-hidden"
        id={inputId}
        multiple
        onChange={handleFileChange}
        type="file"
      />
      <label
        className={isDragging ? 'upload-drop-zone dragging' : 'upload-drop-zone'}
        htmlFor={inputId}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ImagePlus aria-hidden="true" size={21} strokeWidth={2.1} />
        <span>이미지 선택</span>
        <small>PNG, JPG, JPEG, WebP</small>
      </label>
      {errorMessage && (
        <div className="upload-error" role="alert">
          <span>{errorMessage}</span>
          <button aria-label="오류 메시지 닫기" onClick={() => setErrorMessage('')} type="button">
            닫기
          </button>
        </div>
      )}
      {selectedImage ? (
        <figure className="upload-preview">
          <img alt={`${selectedImage.fileName} 미리보기`} src={selectedImage.objectUrl} />
          <figcaption>
            <strong>{selectedImage.fileName}</strong>
            <span>
              {selectedImage.width} x {selectedImage.height}px / {formatFileSize(selectedImage.fileSize)}
            </span>
          </figcaption>
          <button className="panel-action" onClick={() => onPlaceImage(selectedImage)} type="button">
            선택 이미지 캔버스 배치
          </button>
        </figure>
      ) : (
        <div className="empty-list">업로드한 이미지가 없습니다.</div>
      )}
      {images.length > 0 && (
        <div className="upload-list" aria-label="업로드 이미지 목록">
          {images.map((image) => (
            <article className={selectedImageId === image.id ? 'upload-item active' : 'upload-item'} key={image.id}>
              <button
                className="upload-select"
                onClick={() => setSelectedImageId(image.id)}
                type="button"
                aria-label={`${image.fileName} 선택`}
              >
                <img alt="" src={image.objectUrl} />
                <span>
                  <strong>{image.fileName}</strong>
                  <small>
                    {image.width} x {image.height}px / {formatFileSize(image.fileSize)}
                  </small>
                </span>
              </button>
              <button
                aria-label={`${image.fileName} 삭제`}
                className="upload-delete"
                onClick={() => removeImage(image.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} strokeWidth={2.1} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
