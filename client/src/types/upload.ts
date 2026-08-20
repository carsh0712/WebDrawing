export interface UploadedImage {
  id: string;
  createdAt: string;
  fileName: string;
  fileSize: number;
  height: number;
  objectUrl: string;
  type: string;
  width: number;
}

export interface ImageUploadState {
  addFiles: (fileList: FileList | File[]) => Promise<void>;
  errorMessage: string;
  images: UploadedImage[];
  isDragging: boolean;
  removeImage: (imageId: string) => void;
  selectedImage: UploadedImage | null;
  selectedImageId: string | null;
  setErrorMessage: (message: string) => void;
  setIsDragging: (isDragging: boolean) => void;
  setSelectedImageId: (imageId: string | null) => void;
}

export interface UploadValidationResult {
  message: string;
  valid: boolean;
}
