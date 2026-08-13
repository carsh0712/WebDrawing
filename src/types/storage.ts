import type { CanvasSize } from './drawing';

export interface SavedCanvasWork {
  canvasSize: CanvasSize;
  createdAt: string;
  id: string;
  imageDataUrl: string;
  name: string;
  thumbnailDataUrl: string;
  updatedAt: string;
}

export interface SaveCanvasInput {
  canvasSize: CanvasSize;
  imageDataUrl: string;
  name: string;
  thumbnailDataUrl: string;
}

export interface CanvasStorageState {
  errorMessage: string;
  savedWorks: SavedCanvasWork[];
  saveCurrentWork: (input: SaveCanvasInput, workId?: string | null) => SavedCanvasWork;
  deleteWork: (workId: string) => void;
  setErrorMessage: (message: string) => void;
}
