# WebDrawingCanvas

WebDrawingCanvas는 브라우저에서 바로 그림을 그리고, 작업 결과를 로컬 저장 및 다운로드할 수 있는 웹 기반 드로잉 캔버스 MVP입니다.

## 개발 스택

- React
- Vite
- TypeScript
- HTML Canvas API

## 실행

처음 준비하거나 개발 DB를 새로 초기화하려면 루트에서 setup을 실행합니다.

```bash
npm run setup
```

`npm run setup`은 서버 의존성 설치, 개발 DB 볼륨 초기화, DB 테이블 생성 확인, 클라이언트 의존성 설치, 클라이언트 빌드, 서버 public 퍼블리싱까지 진행합니다.

개발 서버를 실행하려면 루트에서 dev를 실행합니다.

```bash
npm run dev
```

루트 `npm run dev`는 서버 의존성 설치, 개발 DB 연결/테이블 확인, 클라이언트 의존성 설치, 클라이언트 빌드, 서버 public 퍼블리싱 후 서버와 클라이언트를 함께 실행합니다.

- 서버: `http://localhost:5174`
- 클라이언트: `http://localhost:5173`

개별 앱만 실행해야 할 때는 아래 명령을 사용합니다.

```bash
npm run server:dev
npm --prefix client run dev
```

## 문서

- [문서 홈](./docs/html/index.html)
- [기획서](./docs/html/planning/index.html)
- [개발 계획서](./docs/html/development-plan/index.html)
- [10단계 개발 계획](./docs/html/development-plan/step-10/index.html)
- [클라이언트/서버 분리 원칙](./docs/backend/client-server-boundary.md)
- [백엔드 API 계약 초안](./docs/backend/api-contract.md)
- [환경별 DB 전략](./docs/backend/environment-strategy.md)

## 앱 구조

```text
client/
  src/
    assets/        업로드 이미지, 아이콘, 샘플 데이터 준비 위치
    components/    캔버스, 도구 바, 패널, 저장소 UI 컴포넌트
    hooks/         캔버스 입력, 저장, 업로드 등 React 훅
    services/      로컬 저장, 파일 다운로드, 이미지 처리 서비스
    styles/        전역 스타일과 앱 스타일
    types/         앱 공통 TypeScript 타입

server/
  next-app/        Next.js API, 서버 전용 Supabase 클라이언트, 백엔드 환경 변수
    docker-compose.yml  개발용 Docker Postgres

docs/
  backend/         API 계약, 클라이언트/서버 경계, Supabase 스키마 초안
```

## 클라이언트/서버 분리

현재 `client/`는 브라우저에서 실행되는 Vite 프론트엔드 전용 영역입니다. Next.js 백엔드는 `server/next-app/` 아래에서 별도로 준비하며, `SUPABASE_SERVICE_ROLE_KEY` 같은 서버 전용 값은 프론트엔드에 두지 않습니다.

운영 환경은 Supabase DB/Storage를 사용하고, 개발 환경은 `server/next-app/docker-compose.yml`의 Docker Postgres를 사용합니다.
