import { useCallback, useEffect, useState } from 'react';
import { readSavedWorks, writeSavedWorks } from '../services/canvasStorageService';
import type { CanvasStorageState, SavedCanvasWork, SaveCanvasInput } from '../types/storage';

const createSavedWorkId = () => `saved-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function useCanvasStorage(): CanvasStorageState {
  const [errorMessage, setErrorMessage] = useState('');
  const [savedWorks, setSavedWorks] = useState<SavedCanvasWork[]>([]);

  useEffect(() => {
    setSavedWorks(readSavedWorks());
  }, []);

  const saveCurrentWork = useCallback(
    (input: SaveCanvasInput, workId?: string | null) => {
      const now = new Date().toISOString();
      const existingWork = workId ? savedWorks.find((work) => work.id === workId) : null;
      const savedWork: SavedCanvasWork = {
        canvasSize: input.canvasSize,
        createdAt: existingWork?.createdAt ?? now,
        id: existingWork?.id ?? createSavedWorkId(),
        imageDataUrl: input.imageDataUrl,
        name: input.name.trim() || '제목 없는 작업',
        thumbnailDataUrl: input.thumbnailDataUrl,
        updatedAt: now,
      };
      const nextSavedWorks = existingWork
        ? savedWorks.map((work) => (work.id === existingWork.id ? savedWork : work))
        : [savedWork, ...savedWorks];

      try {
        writeSavedWorks(nextSavedWorks);
        setSavedWorks(nextSavedWorks);
        setErrorMessage('');
        return savedWork;
      } catch {
        setErrorMessage('브라우저 로컬 저장소에 저장할 수 없습니다. 저장 공간을 확인해 주세요.');
        throw new Error('작업을 저장하지 못했습니다.');
      }
    },
    [savedWorks],
  );

  const deleteWork = useCallback((workId: string) => {
    setSavedWorks((currentSavedWorks) => {
      const nextSavedWorks = currentSavedWorks.filter((work) => work.id !== workId);

      try {
        writeSavedWorks(nextSavedWorks);
        setErrorMessage('');
        return nextSavedWorks;
      } catch {
        setErrorMessage('저장 목록을 갱신할 수 없습니다.');
        return currentSavedWorks;
      }
    });
  }, []);

  return {
    deleteWork,
    errorMessage,
    saveCurrentWork,
    savedWorks,
    setErrorMessage,
  };
}
