import type { SavedCanvasWork } from '../types/storage';

const storageKey = 'web-drawing-canvas.saved-works';

export const readSavedWorks = (): SavedCanvasWork[] => {
  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

export const writeSavedWorks = (savedWorks: SavedCanvasWork[]) => {
  window.localStorage.setItem(storageKey, JSON.stringify(savedWorks));
};
