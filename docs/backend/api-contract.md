# WebDrawingCanvas 백엔드 API 계약 초안

기준 경로는 Next.js 백엔드의 `/api`다. 모든 응답은 JSON을 사용한다. 개발 환경에서는 Docker Postgres에 고정 개발 사용자로 저장하고, 인증이 필요한 API는 이후 Supabase Auth 세션 검증을 붙인다.

클라이언트는 기본적으로 `VITE_API_BASE_URL` 값을 API 기준 URL로 사용한다. 값이 없으면 개발 서버 기본값인 `http://localhost:5174`를 사용한다.

## 공통 응답

성공 응답:

```json
{
  "data": {}
}
```

오류 응답:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "요청 값이 올바르지 않습니다."
  }
}
```

## GET /api/health

백엔드 배포와 환경 변수 연결 상태를 확인한다.

응답:

```json
{
  "data": {
    "ok": true,
    "service": "web-drawing-canvas-api"
  }
}
```

## GET /api/drawings

로그인 사용자의 작업 목록을 조회한다.

응답:

```json
{
  "data": [
    {
      "id": "drawing_123",
      "name": "제목 없는 작업",
      "canvasSize": { "width": 1280, "height": 720 },
      "thumbnailUrl": "https://example.com/thumb.png",
      "createdAt": "2026-08-20T01:00:00.000Z",
      "updatedAt": "2026-08-20T01:10:00.000Z"
    }
  ]
}
```

## POST /api/drawings

작업을 새로 저장한다.

요청:

```json
{
  "name": "작업 이름",
  "canvasSize": { "width": 1280, "height": 720 },
  "imageDataUrl": "data:image/png;base64,...",
  "thumbnailDataUrl": "data:image/png;base64,...",
  "projectData": {}
}
```

응답:

```json
{
  "data": {
    "id": "drawing_123",
    "name": "작업 이름",
    "createdAt": "2026-08-20T01:00:00.000Z",
    "updatedAt": "2026-08-20T01:00:00.000Z"
  }
}
```

## GET /api/drawings/:drawingId

단일 작업을 불러온다.

응답:

```json
{
  "data": {
    "id": "drawing_123",
    "name": "작업 이름",
    "canvasSize": { "width": 1280, "height": 720 },
    "imageUrl": "https://example.com/full.png",
    "thumbnailUrl": "https://example.com/thumb.png",
    "projectData": {},
    "createdAt": "2026-08-20T01:00:00.000Z",
    "updatedAt": "2026-08-20T01:00:00.000Z"
  }
}
```

## PUT /api/drawings/:drawingId

기존 작업을 덮어쓴다.

요청은 `POST /api/drawings`와 같고, 응답은 갱신된 메타데이터를 반환한다.

## DELETE /api/drawings/:drawingId

작업과 연결된 서버 저장 이미지를 삭제한다.

응답:

```json
{
  "data": {
    "deleted": true
  }
}
```

## POST /api/uploads

업로드 이미지 메타데이터를 저장한다. 개발 환경은 DB 메타데이터 저장을 우선 구현하고, 운영 환경의 실제 Supabase Storage 파일 저장은 인증/권한 정책과 함께 확장한다. 요청은 `multipart/form-data`를 사용한다.

필드:

| 이름 | 설명 |
| --- | --- |
| `file` | PNG, JPG, JPEG, WebP 이미지 |
| `drawingId` | 연결할 작업 ID, 선택값 |

응답:

```json
{
  "data": {
    "id": "upload_123",
    "fileName": "reference.png",
    "mimeType": "image/png",
    "fileUrl": "https://example.com/reference.png",
    "createdAt": "2026-08-20T01:00:00.000Z"
  }
}
```
