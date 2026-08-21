import { jsonData, jsonError, optionsResponse } from '@/lib/http';
import { ApiAuthError, requireApiUser } from '@/lib/auth';
import { createDrawingRepository, isValidSaveDrawingInput } from '@/lib/repositories/drawingRepository';
import type { SaveDrawingRequestDto } from '@/types/drawing';

export const runtime = 'nodejs';

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  try {
    const userContext = await requireApiUser(request);
    const drawings = await createDrawingRepository(userContext).listDrawings();

    return jsonData(drawings);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return jsonError('UNAUTHORIZED', error.message, 401);
    }

    console.error('[api/drawings] Failed to list drawings.', error);

    return jsonError('DATABASE_ERROR', '작업 목록을 조회할 수 없습니다.', 500);
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SaveDrawingRequestDto | null;

  if (!isValidSaveDrawingInput(body)) {
    return jsonError('VALIDATION_ERROR', '작업 저장에 필요한 값이 부족합니다.');
  }

  try {
    const userContext = await requireApiUser(request);
    const drawing = await createDrawingRepository(userContext).createDrawing(body);

    return jsonData(drawing, { status: 201 });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return jsonError('UNAUTHORIZED', error.message, 401);
    }

    console.error('[api/drawings] Failed to create drawing.', error);

    return jsonError('DATABASE_ERROR', '작업을 저장할 수 없습니다.', 500);
  }
}
