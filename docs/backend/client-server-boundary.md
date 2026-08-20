# WebDrawingCanvas 클라이언트/서버 분리 원칙

10단계부터는 프론트엔드 MVP를 유지하면서 Next.js 백엔드를 추가한다. 두 영역이 섞이면 브라우저 번들에 서버 키가 들어가거나, 로컬 저장 MVP가 서버 구현에 끌려가면서 유지보수가 어려워질 수 있으므로 아래 경계를 기준으로 개발한다.

## 디렉터리 경계

| 영역 | 위치 | 역할 |
| --- | --- | --- |
| 프론트엔드 MVP | `client/` | React + Vite + TypeScript 앱, Canvas UI, 브라우저 로컬 저장, PNG 다운로드 |
| 백엔드 준비 | `server/next-app/` | Next.js API 라우트, 서버 전용 Supabase 클라이언트, 인증/저장 API |
| 계약 문서 | `docs/backend/` | API 계약, Supabase 스키마, 배포/보안 정책 |

## 금지 사항

- `client/`에서 `SUPABASE_SERVICE_ROLE_KEY`를 읽지 않는다.
- `client/`에서 `@supabase/supabase-js` 서버 권한 클라이언트를 직접 만들지 않는다.
- `server/next-app/`에서 React Canvas 컴포넌트나 브라우저 전용 훅을 import하지 않는다.
- 서버 API 응답 형태를 컴포넌트 내부에 흩뿌리지 않는다. API 계약 문서를 먼저 갱신한다.
- Vite 환경 변수에는 서버 전용 값을 두지 않는다.

## 허용되는 연결 방식

프론트엔드는 서버 구현을 직접 알지 않고 HTTP API만 호출한다. 현재 MVP는 `client/src/services/canvasStorageService.ts`가 브라우저 로컬 저장을 담당한다. 서버 저장을 붙일 때는 같은 사용자 흐름을 유지하면서 별도 원격 저장 서비스 파일을 추가한다.

권장 이름:

- `client/src/services/canvasStorageService.ts`: 브라우저 로컬 저장 전용
- `client/src/services/remoteCanvasStorageService.ts`: Next.js API 호출 전용
- `client/src/types/storage.ts`: 프론트 화면에서 사용하는 저장 타입
- `docs/backend/api-contract.md`: 서버 API 요청/응답 계약

## 환경 변수 경계

| 변수 | 위치 | 노출 범위 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Next.js | 브라우저 노출 가능 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js | 브라우저 노출 가능, RLS 필수 |
| `SUPABASE_SERVICE_ROLE_KEY` | Next.js 서버 | 서버 전용, 브라우저 노출 금지 |
| `DATABASE_PROVIDER` | Next.js 서버 | `docker-postgres` 또는 `supabase` |
| `DATABASE_URL` | Next.js 서버 | 개발 Docker DB 접속 문자열 |
| `APP_BASE_URL` | Next.js 서버 | 공유 링크 생성용 |

## 단계별 전환 전략

1. 현재 프론트 MVP는 로컬 저장을 기본값으로 유지한다.
2. Next.js API는 `server/next-app`에서 먼저 헬스체크와 계약 기반 placeholder로 만든다.
3. Supabase 프로젝트와 RLS 정책이 확정된 뒤 API 내부 구현을 채운다.
4. 프론트에는 원격 저장 서비스를 새 파일로 추가하고, 로컬/서버 저장 선택은 명시적인 설정으로 전환한다.
5. 서버 저장이 안정화되기 전까지 로컬 저장 기능을 제거하지 않는다.
