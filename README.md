# WebDrawingCanvas

WebDrawingCanvas는 브라우저에서 바로 그림을 그리고, 작업 결과를 로컬 저장 및 다운로드할 수 있는 웹 기반 드로잉 캔버스 MVP입니다.

## 개발 스택

- React
- Vite
- TypeScript
- HTML Canvas API

## 실행

```bash
npm install
npm run dev
```

## 문서

- [문서 홈](./docs/html/index.html)
- [기획서](./docs/html/planning/index.html)
- [개발 계획서](./docs/html/development-plan/index.html)
- [1단계 개발 계획](./docs/html/development-plan/step-01/index.html)

## 앱 구조

```text
src/
  assets/          업로드 이미지, 아이콘, 샘플 데이터 준비 위치
  components/      캔버스, 도구 바, 패널, 저장소 UI 컴포넌트
  hooks/           캔버스 입력, 저장, 업로드 등 React 훅
  services/        로컬 저장, 파일 다운로드, 이미지 처리 서비스
  styles/          전역 스타일과 앱 스타일
  types/           앱 공통 TypeScript 타입
```
