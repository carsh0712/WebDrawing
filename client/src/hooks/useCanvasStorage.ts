import { useCallback, useEffect, useState } from 'react';
import { readSavedWorks, writeSavedWorks } from '../services/canvasStorageService';
import {
  deleteRemoteWork,
  loadRemoteWork,
  readRemoteSavedWorks,
  saveRemoteWork,
} from '../services/remoteCanvasStorageService';
import type { CanvasStorageMode, CanvasStorageState, SavedCanvasWork, SaveCanvasInput } from '../types/storage';

const createSavedWorkId = () => `saved-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function useCanvasStorage(): CanvasStorageState {
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setModeState] = useState<CanvasStorageMode>('local');
  const [savedWorks, setSavedWorks] = useState<SavedCanvasWork[]>([]);

  const refreshSavedWorks = useCallback(async () => {
    setIsLoading(true);

    try {
      setSavedWorks(mode === 'remote' ? await readRemoteSavedWorks() : readSavedWorks());
      setErrorMessage('');
    } catch (error) {
      console.error(error);
      setErrorMessage('서버 저장 목록을 불러올 수 없습니다. 서버 실행 상태를 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void refreshSavedWorks();
  }, [refreshSavedWorks]);

  const setMode = useCallback((nextMode: CanvasStorageMode) => {
    setModeState(nextMode);
    setErrorMessage('');
  }, []);

  const saveCurrentWork = useCallback(
    async (input: SaveCanvasInput, workId?: string | null) => {
      setIsLoading(true);

      if (mode === 'remote') {
        try {
          const savedWork = await saveRemoteWork(input, workId);
          setSavedWorks((currentSavedWorks) => {
            const hasSavedWork = currentSavedWorks.some((work) => work.id === savedWork.id);

            return hasSavedWork
              ? currentSavedWorks.map((work) => (work.id === savedWork.id ? savedWork : work))
              : [savedWork, ...currentSavedWorks];
          });
          setErrorMessage('');
          return savedWork;
        } catch (error) {
          console.error(error);
          setErrorMessage('서버에 작업을 저장할 수 없습니다. 서버와 DB 연결 상태를 확인해 주세요.');
          throw new Error('서버에 작업을 저장하지 못했습니다.');
        } finally {
          setIsLoading(false);
        }
      }

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
      } catch (error) {
        console.error(error);
        setErrorMessage('브라우저 로컬 저장소에 저장할 수 없습니다. 저장 공간을 확인해 주세요.');
        throw new Error('작업을 저장하지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [mode, savedWorks],
  );

  const deleteWork = useCallback(async (workId: string) => {
    setIsLoading(true);

    if (mode === 'remote') {
      try {
        await deleteRemoteWork(workId);
        setSavedWorks((currentSavedWorks) => currentSavedWorks.filter((work) => work.id !== workId));
        setErrorMessage('');
      } catch (error) {
        console.error(error);
        setErrorMessage('서버 저장 작업을 삭제할 수 없습니다.');
        throw new Error('서버 저장 작업을 삭제하지 못했습니다.');
      } finally {
        setIsLoading(false);
      }

      return;
    }

    setSavedWorks((currentSavedWorks) => {
      const nextSavedWorks = currentSavedWorks.filter((work) => work.id !== workId);

      try {
        writeSavedWorks(nextSavedWorks);
        setErrorMessage('');
        return nextSavedWorks;
      } catch (error) {
        console.error(error);
        setErrorMessage('저장 목록을 갱신할 수 없습니다.');
        return currentSavedWorks;
      }
    });
    setIsLoading(false);
  }, [mode]);

  const loadWork = useCallback(
    async (work: SavedCanvasWork) => {
      if (mode === 'local' || work.imageDataUrl) {
        return work;
      }

      try {
        return await loadRemoteWork(work.id);
      } catch (error) {
        console.error(error);
        setErrorMessage('서버 저장 작업을 불러올 수 없습니다.');
        throw error;
      }
    },
    [mode],
  );

  return {
    deleteWork,
    errorMessage,
    isLoading,
    loadWork,
    mode,
    refreshSavedWorks,
    saveCurrentWork,
    savedWorks,
    setErrorMessage,
    setMode,
  };
}
