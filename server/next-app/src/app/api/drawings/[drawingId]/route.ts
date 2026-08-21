import { jsonData, jsonError, optionsResponse } from '@/lib/http';
import { ApiAuthError, requireApiUser } from '@/lib/auth';
import { createDrawingRepository, isValidSaveDrawingInput } from '@/lib/repositories/drawingRepository';
import type { SaveDrawingRequestDto } from '@/types/drawing';

export const runtime = 'nodejs';

export function OPTIONS() {
  return optionsResponse();
}

interface RouteContext {
  params: Promise<{
    drawingId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { drawingId } = await context.params;

  try {
    const userContext = await requireApiUser(request);
    const drawing = await createDrawingRepository(userContext).getDrawing(drawingId);

    if (!drawing) {
      return jsonError('NOT_FOUND', '작업을 찾을 수 없습니다.', 404);
    }

    return jsonData(drawing);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return jsonError('UNAUTHORIZED', error.message, 401);
    }

    console.error('[api/drawings/:drawingId] Failed to get drawing.', error);

    return jsonError('DATABASE_ERROR', '작업을 조회할 수 없습니다.', 500);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { drawingId } = await context.params;
  const body = (await request.json().catch(() => null)) as SaveDrawingRequestDto | null;

  if (!isValidSaveDrawingInput(body)) {
    return jsonError('VALIDATION_ERROR', '작업 갱신에 필요한 값이 부족합니다.');
  }

  try {
    const userContext = await requireApiUser(request);
    const drawing = await createDrawingRepository(userContext).updateDrawing(drawingId, body);

    if (!drawing) {
      return jsonError('NOT_FOUND', '작업을 찾을 수 없습니다.', 404);
    }

    return jsonData(drawing);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return jsonError('UNAUTHORIZED', error.message, 401);
    }

    console.error('[api/drawings/:drawingId] Failed to update drawing.', error);

    return jsonError('DATABASE_ERROR', '작업을 갱신할 수 없습니다.', 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { drawingId } = await context.params;

  try {
    const userContext = await requireApiUser(request);
    const deleted = await createDrawingRepository(userContext).deleteDrawing(drawingId);

    if (!deleted) {
      return jsonError('NOT_FOUND', '작업을 찾을 수 없습니다.', 404);
    }

    return jsonData({ deleted: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return jsonError('UNAUTHORIZED', error.message, 401);
    }

    console.error('[api/drawings/:drawingId] Failed to delete drawing.', error);

    return jsonError('DATABASE_ERROR', '작업을 삭제할 수 없습니다.', 500);
  }
}
