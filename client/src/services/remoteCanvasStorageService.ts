import type { SavedCanvasWork, SaveCanvasInput } from '../types/storage';

interface ApiResponse<TData> {
  data: TData;
}

interface RemoteDrawingSummary {
  canvasSize: SavedCanvasWork['canvasSize'];
  createdAt: string;
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
}

interface RemoteDrawingDetail extends RemoteDrawingSummary {
  imageUrl: string | null;
  projectData: Record<string, unknown>;
}

const apiBaseUrl = (import.meta.env.DEV ? import.meta.env.VITE_API_BASE_URL || 'http://localhost:5174' : '').replace(
  /\/$/,
  '',
);

const requestJson = async <TData>(path: string, init?: RequestInit) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as ApiResponse<TData> | { error?: { message?: string } } | null;

  if (!response.ok) {
    const message = body && 'error' in body ? body.error?.message : null;
    throw new Error(message || '서버 요청에 실패했습니다.');
  }

  if (!body || !('data' in body)) {
    throw new Error('서버 응답을 읽을 수 없습니다.');
  }

  return body.data;
};

const toSavedCanvasWork = (drawing: RemoteDrawingDetail | RemoteDrawingSummary): SavedCanvasWork => ({
  canvasSize: drawing.canvasSize,
  createdAt: drawing.createdAt,
  id: drawing.id,
  imageDataUrl: 'imageUrl' in drawing ? drawing.imageUrl || '' : '',
  name: drawing.name,
  thumbnailDataUrl: drawing.thumbnailUrl || '',
  updatedAt: drawing.updatedAt,
});

export const readRemoteSavedWorks = async () => {
  const drawings = await requestJson<RemoteDrawingSummary[]>('/api/drawings');

  return drawings.map(toSavedCanvasWork);
};

export const saveRemoteWork = async (input: SaveCanvasInput, workId?: string | null) => {
  const drawing = await requestJson<RemoteDrawingDetail>(workId ? `/api/drawings/${workId}` : '/api/drawings', {
    body: JSON.stringify(input),
    method: workId ? 'PUT' : 'POST',
  });

  return toSavedCanvasWork(drawing);
};

export const loadRemoteWork = async (workId: string) => {
  const drawing = await requestJson<RemoteDrawingDetail>(`/api/drawings/${workId}`);

  return toSavedCanvasWork(drawing);
};

export const deleteRemoteWork = async (workId: string) => {
  await requestJson<{ deleted: boolean }>(`/api/drawings/${workId}`, {
    method: 'DELETE',
  });
};
