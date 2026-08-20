# WebDrawingCanvas Next.js Backend

이 폴더는 10단계 백엔드 준비 영역이다. 현재 `client/`의 Vite 프론트엔드 MVP와 섞지 않기 위해 `server/next-app/`에 독립 Next.js 앱으로 둔다.

## 역할

- `/api/health`: 배포와 환경 변수 상태 확인
- `/api/drawings`: 작업물 저장/목록 조회 API
- `/api/drawings/[drawingId]`: 단일 작업 조회/수정/삭제 API
- `/api/uploads`: Supabase Storage 업로드 API
- `src/lib/supabase/server.ts`: 서버 전용 Supabase 클라이언트 생성 위치

## 실행 준비

이 폴더에서 별도 의존성을 설치한다.

```bash
npm install
npm run dev
```

개발 DB는 Docker Postgres로 실행한다.

```bash
npm run db:dev:up
```

이 프로젝트의 DB 스크립트는 `docker-compose` 명령을 사용한다. Docker Desktop 버전에 따라 `docker compose`만 지원되는 환경이라면 `package.json`의 `db:dev:*` 스크립트에서 명령 이름만 바꾼다.

루트 Vite 앱은 계속 루트에서 실행한다.

```bash
npm run dev
```

## Vercel 배포 빌드

Vercel 프로젝트는 저장소 루트가 아니라 이 폴더를 기준으로 잡는다.

```text
Root Directory: server/next-app
Framework Preset: Next.js
Build Command: npm run build
Output Directory: 비워둠
```

Vercel 환경 변수에는 `VITE_API_BASE_URL`을 등록하지 않는다. Production/Preview 클라이언트는 현재 접속한 배포 도메인의 `/api`를 상대 경로로 호출한다. Preview URL은 배포마다 바뀌므로 특정 preview 주소를 API base URL로 고정하지 않는다.

배포 후 <code>/</code>가 정적 HTML을 바로 반환하고 <code>/api/health</code>가 Vercel <code>NOT_FOUND</code>를 반환하면, Vercel이 Next.js 앱이 아니라 <code>public</code> 폴더를 정적 결과물로 배포한 상태다. 이 경우 Output Directory에 남아 있는 <code>public</code> 값을 지우고 다시 배포한다.

이 폴더의 `npm run build`는 다음 순서로 동작한다.

1. `../../client` 의존성을 `npm ci`로 설치한다.
2. Vite 클라이언트를 빌드해 `client/dist`를 만든다.
3. `client/dist`를 `server/next-app/public`으로 복사한다.
4. `next build`를 실행한다.

따라서 Vercel의 Output Directory를 `public`으로 직접 지정하지 않는다. `public`은 Next.js가 정적 파일을 읽는 입력 폴더이고, Vercel 배포 산출물 폴더가 아니다.

## 환경 변수

`.env.example`을 기준으로 `.env.local`을 만든다. `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용이며 프론트엔드 `client/` 또는 Vite 환경 변수에 넣지 않는다.

- 개발: `DATABASE_PROVIDER=docker-postgres`, `DATABASE_URL=postgres://webdrawing:webdrawing_dev_password@localhost:54322/webdrawing_dev`
- 운영: `DATABASE_PROVIDER=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- CORS: 여러 Vercel preview URL에서 같은 API를 호출해야 하면 `APP_ALLOWED_ORIGINS`에 쉼표로 구분해 추가한다.

## 현재 상태

Supabase 프로젝트와 실제 키가 아직 확정되지 않았으므로 API는 계약과 경계를 고정하기 위한 placeholder를 반환한다. DB 연결이 준비되면 `docs/backend/api-contract.md`와 `docs/backend/supabase-schema.sql`을 기준으로 구현한다.
