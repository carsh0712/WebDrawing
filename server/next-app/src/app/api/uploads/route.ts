import { jsonData, jsonError, optionsResponse } from '@/lib/http';
import { createDrawingRepository } from '@/lib/repositories/drawingRepository';

export const runtime = 'nodejs';

const supportedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

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

  try {
    const upload = await createDrawingRepository().createUpload({
      byteSize: file.size,
      fileName: file.name,
      mimeType: file.type,
      projectId: typeof drawingId === 'string' && drawingId.trim() ? drawingId : null,
      storagePath: `dev-uploads/${crypto.randomUUID()}-${file.name}`,
    });

    return jsonData(upload, { status: 201 });
  } catch {
    return jsonError('DATABASE_ERROR', '업로드 메타데이터를 저장할 수 없습니다.', 500);
  }
}
