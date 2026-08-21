import { jsonData, jsonError, optionsResponse } from '@/lib/http';
import { ApiAuthError, requireApiUser } from '@/lib/auth';
import { createDrawingRepository } from '@/lib/repositories/drawingRepository';

export const runtime = 'nodejs';

const supportedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const maxUploadBytes = 10 * 1024 * 1024;

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  const drawingId = formData?.get('drawingId');

  if (!(file instanceof File)) {
    return jsonError('VALIDATION_ERROR', '업로드할 이미지 파일이 필요합니다.');
  }

  if (!supportedImageTypes.has(file.type)) {
    return jsonError('UNSUPPORTED_MEDIA_TYPE', 'PNG, JPG, JPEG, WebP 이미지만 업로드할 수 있습니다.', 415);
  }

  if (file.size > maxUploadBytes) {
    return jsonError('PAYLOAD_TOO_LARGE', '이미지는 10MB 이하만 업로드할 수 있습니다.', 413);
  }

  try {
    const userContext = await requireApiUser(request);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'upload';
    const upload = await createDrawingRepository(userContext).createUpload({
      byteSize: file.size,
      fileName: file.name,
      mimeType: file.type,
      projectId: typeof drawingId === 'string' && drawingId.trim() ? drawingId : null,
      storagePath: `dev-uploads/${userContext.userId}/${crypto.randomUUID()}-${safeFileName}`,
    });

    return jsonData(upload, { status: 201 });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return jsonError('UNAUTHORIZED', error.message, 401);
    }

    return jsonError('DATABASE_ERROR', '업로드 메타데이터를 저장할 수 없습니다.', 500);
  }
}
