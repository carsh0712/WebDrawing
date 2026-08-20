# WebDrawingCanvas 환경별 DB 전략

운영 환경은 Supabase Database와 Storage를 사용한다. 개발 환경은 Docker로 실행한 로컬 Postgres를 사용한다. 앱의 API 계약은 동일하게 유지하고, DB 제공자만 환경 변수로 바꾼다.

## 환경 구분

| 환경 | DB 제공자 | 위치 | 목적 |
| --- | --- | --- | --- |
| 개발 | Docker Postgres | `server/next-app/docker-compose.yml` | 로컬 개발, 마이그레이션 검증, 비용 없는 반복 작업 |
| 운영 | Supabase | Supabase 프로젝트 | 인증, RLS, Storage, 배포된 서비스 데이터 |

## 환경 변수

개발 `.env.local`:

```bash
APP_ENV=development
DATABASE_PROVIDER=docker-postgres
DATABASE_URL=postgres://webdrawing:webdrawing_dev_password@localhost:54322/webdrawing_dev
APP_SERVICE_USER_ID=00000000-0000-4000-8000-000000000001
APP_BASE_URL=http://localhost:5174
```

운영 Vercel 환경 변수:

```bash
APP_ENV=production
DATABASE_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_BASE_URL=
```

## 개발 DB 실행

```bash
cd server/next-app
npm run db:dev:up
```

현재 개발 스크립트는 Windows 환경에서 확인된 `docker-compose` 명령을 사용한다. Docker Desktop 버전에 따라 `docker compose`만 지원되는 환경이라면 `server/next-app/package.json`의 `db:dev:*` 스크립트에서 명령 이름만 바꾼다.

중지:

```bash
npm run db:dev:down
```

DB를 완전히 초기화하려면 Docker volume까지 삭제한다.

```bash
npm run db:dev:reset
```

## 스키마 기준

- 개발 Docker DB 초기 스키마는 `server/next-app/db/init/001_schema.sql`에 둔다.
- 운영 Supabase 적용 초안은 `docs/backend/supabase-schema.sql`에 둔다.
- 두 파일은 같은 테이블 이름과 핵심 컬럼을 유지한다.
- 개발 DB는 Supabase Auth를 완전히 실행하지 않으므로 `auth.users`와 `auth.uid()`를 가볍게 흉내 낸다.
- 운영에서는 Supabase Auth, RLS, Storage 정책을 실제 프로젝트에서 검증한다.

## 구현 규칙

1. API 라우트는 `DATABASE_PROVIDER`를 보고 DB 연결 방식을 선택한다.
2. 운영 전용 `SUPABASE_SERVICE_ROLE_KEY`는 `DATABASE_PROVIDER=supabase`일 때만 필요하다.
3. 개발 Docker DB에는 서버 전용 키를 넣지 않는다.
4. 프론트엔드 `client/`는 어떤 DB 제공자인지 알지 않는다.
5. Storage가 필요한 업로드 기능은 개발 단계에서 파일 메타데이터 DB 저장부터 구현하고, 운영에서 Supabase Storage를 연결한다.
