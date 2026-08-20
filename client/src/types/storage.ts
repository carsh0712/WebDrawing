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

export type CanvasStorageMode = 'local' | 'remote';

export interface SaveCanvasInput {
  canvasSize: CanvasSize;
  imageDataUrl: string;
  name: string;
  thumbnailDataUrl: string;
}

export interface CanvasStorageState {
  errorMessage: string;
  isLoading: boolean;
  mode: CanvasStorageMode;
  savedWorks: SavedCanvasWork[];
  deleteWork: (workId: string) => Promise<void>;
  loadWork: (work: SavedCanvasWork) => Promise<SavedCanvasWork>;
  refreshSavedWorks: () => Promise<void>;
  saveCurrentWork: (input: SaveCanvasInput, workId?: string | null) => Promise<SavedCanvasWork>;
  setErrorMessage: (message: string) => void;
  setMode: (mode: CanvasStorageMode) => void;
}
