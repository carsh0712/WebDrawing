import { jsonData, jsonError, optionsResponse } from '@/lib/http';
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

export async function GET(_request: Request, context: RouteContext) {
  const { drawingId } = await context.params;

  try {
    const drawing = await createDrawingRepository().getDrawing(drawingId);

    if (!drawing) {
      return jsonError('NOT_FOUND', '작업을 찾을 수 없습니다.', 404);
    }

    return jsonData(drawing);
  } catch {
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
    const drawing = await createDrawingRepository().updateDrawing(drawingId, body);

    if (!drawing) {
      return jsonError('NOT_FOUND', '작업을 찾을 수 없습니다.', 404);
    }

    return jsonData(drawing);
  } catch {
    return jsonError('DATABASE_ERROR', '작업을 갱신할 수 없습니다.', 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { drawingId } = await context.params;

  try {
    const deleted = await createDrawingRepository().deleteDrawing(drawingId);

    if (!deleted) {
      return jsonError('NOT_FOUND', '작업을 찾을 수 없습니다.', 404);
    }

    return jsonData({ deleted: true });
  } catch {
    return jsonError('DATABASE_ERROR', '작업을 삭제할 수 없습니다.', 500);
  }
}
