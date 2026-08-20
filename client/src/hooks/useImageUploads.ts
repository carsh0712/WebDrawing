import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageUploadState, UploadedImage, UploadValidationResult } from '../types/upload';

const supportedImageTypes = ['image/png', 'image/jpeg', 'image/webp'];
const maxFileSize = 12 * 1024 * 1024;

const formatAcceptedTypes = () => 'PNG, JPG, JPEG, WebP';

const createUploadId = () => `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const validateFile = (file: File): UploadValidationResult => {
  if (!supportedImageTypes.includes(file.type)) {
    return {
      message: `${file.name} 파일은 지원하지 않는 형식입니다. ${formatAcceptedTypes()} 이미지만 업로드할 수 있습니다.`,
      valid: false,
    };
  }

  if (file.size > maxFileSize) {
    return {
      message: `${file.name} 파일이 너무 큽니다. 12MB 이하 이미지만 업로드할 수 있습니다.`,
      valid: false,
    };
  }

  return {
    message: '',
    valid: true,
  };
};

const readImageSize = (objectUrl: string) =>
  new Promise<{ height: number; width: number }>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        height: image.naturalHeight,
        width: image.naturalWidth,
      });
    };
    image.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
    image.src = objectUrl;
  });

export function useImageUploads(): ImageUploadState {
  const objectUrlsRef = useRef<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    },
    [],
  );

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);

    if (files.length === 0) {
      return;
    }

    const acceptedImages: UploadedImage[] = [];

    for (const file of files) {
      const validation = validateFile(file);

      if (!validation.valid) {
        setErrorMessage(validation.message);
        continue;
      }

      const objectUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(objectUrl);

      try {
        const size = await readImageSize(objectUrl);
        acceptedImages.push({
          createdAt: new Date().toISOString(),
          fileName: file.name,
          fileSize: file.size,
          height: size.height,
          id: createUploadId(),
          objectUrl,
          type: file.type,
          width: size.width,
        });
      } catch {
        URL.revokeObjectURL(objectUrl);
        objectUrlsRef.current = objectUrlsRef.current.filter((item) => item !== objectUrl);
        setErrorMessage(`${file.name} 파일을 이미지로 읽을 수 없습니다.`);
      }
    }

    if (acceptedImages.length === 0) {
      return;
    }

    setImages((currentImages) => [...acceptedImages, ...currentImages]);
    setSelectedImageId((currentSelectedId) => currentSelectedId ?? acceptedImages[0].id);
    setErrorMessage('');
  }, []);

  const removeImage = useCallback((imageId: string) => {
    setImages((currentImages) => {
      const target = currentImages.find((image) => image.id === imageId);

      if (target) {
        URL.revokeObjectURL(target.objectUrl);
        objectUrlsRef.current = objectUrlsRef.current.filter((objectUrl) => objectUrl !== target.objectUrl);
      }

      const nextImages = currentImages.filter((image) => image.id !== imageId);
      setSelectedImageId((currentSelectedId) => {
        if (currentSelectedId !== imageId) {
          return currentSelectedId;
        }

        return nextImages[0]?.id ?? null;
      });
      return nextImages;
    });
  }, []);

  const selectedImage = images.find((image) => image.id === selectedImageId) ?? null;

  return {
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
  };
}
