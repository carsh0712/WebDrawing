# WebDrawingCanvas

## 프로젝트 개요

WebDrawingCanvas는 웹페이지에서 그림을 그리고, 작업 결과를 저장하고, 다른 사용자와 공유할 수 있는 웹 기반 드로잉 캔버스 시스템이다.

## 현재 문서 상태

- HTML 문서 홈은 `docs/html/index.html`에 작성한다.
- 기획서 목차와 세부 링크는 `docs/html/planning/index.html`에서 관리한다.
- 기획서 개요 세부 페이지는 `docs/html/planning/overview/index.html`에서 관리한다.
- 개발 계획서는 `docs/html/development-plan/index.html`에서 관리한다.
- 개발 단계별 세부 계획은 `docs/html/development-plan/step-01/`부터 `docs/html/development-plan/step-10/` 아래에서 관리한다.
- Vercel 배포, Next.js 백엔드, Supabase DB/Storage 연결 계획은 `docs/html/development-plan/extra-vercel-supabase/index.html`에서 관리한다.
- 기획서의 자세한 내용은 필요에 따라 `docs/html/planning/` 아래 세부 HTML 파일로 나누어 정리한다.

## 초기 목표

- 브라우저에서 바로 사용할 수 있는 드로잉 캔버스 제공
- 기본 드로잉 도구 제공
- 로그인 없는 프론트엔드 MVP 우선 개발
- 작업물 로컬 저장, 저장 목록, 불러오기, 삭제 기능 제공
- 업로드 이미지 보기 및 캔버스 배치 기능 제공
- PNG 다운로드 기능 제공
- MVP 범위와 향후 확장 범위 분리

## 개발 방향

- 프론트엔드 MVP를 먼저 개발한다.
- 프론트엔드는 React + Vite + TypeScript를 사용한다.
- MVP 단계에서는 백엔드 없이 캔버스, 드로잉 도구, 업로드 이미지 보기, 로컬 저장, PNG 다운로드를 완성한다.
- 프론트엔드 MVP 이후 백엔드는 Next.js 프레임워크로 개발한다.
- 백엔드는 인증, 서버 저장, Supabase 연동, 공유 링크 API를 담당한다.
- 배포는 Vercel을 기준으로 계획한다.
- 서버 저장 확장 시 Supabase Database와 Supabase Storage를 사용한다.
- 정식 서비스는 회원가입한 모든 유저를 대상으로 하되, MVP는 로그인 없이 사용할 수 있게 한다.
- 화면 구성은 포토샵처럼 상단 메뉴 바, 좌측 도구 바, 중앙 캔버스, 우측 속성/업로드/저장 패널, 하단 상태 바 구조를 기준으로 한다.

## 작업 지침

- 기획 내용은 확정된 사항과 논의가 필요한 사항을 분리해서 기록한다.
- 개발 계획은 프론트엔드 MVP 단계와 백엔드 확장 단계를 분리해서 작성한다.
- 개발 상태 배지는 `대기`, `진행 중`, `검토 필요`, `완료` 기준으로 관리한다.
- 문서는 한국어를 기본으로 작성한다.
- 프로젝트명은 `WebDrawingCanvas`로 표기한다.
