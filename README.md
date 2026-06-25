# AI Usage Report

회사 내부 Claude Code 사용 현황(프롬프트 이력/일별 카운트/토큰) 리포트.

## 구성
- `apps/server` NestJS + Postgres (Ingest/Parser/Reports)
- `apps/web` React + Vite 관리자 대시보드
- `apps/collector` 각 PC cron 수집기

## 실행
1. `pnpm db:up`
2. `cd apps/server && cp .env.example .env && pnpm migration:run && pnpm start`
3. `cd apps/web && pnpm dev` → http://localhost:5173 (localStorage `adminToken` 설정 필요)
4. 각 PC: `cd apps/collector && cp .env.example .env` 설정 후 cron 등록

## 관리자 토큰 설정
리포트 API(`/reports/*`)는 `x-admin-token` 헤더로 보호됩니다. `ADMIN_TOKEN`이 설정되지 않았거나 헤더가 일치하지 않으면 401입니다(fail-closed).
- 서버: `apps/server/.env`의 `ADMIN_TOKEN` 설정.
- 대시보드: 브라우저에서 `localStorage.setItem('adminToken', '<토큰>')` 실행 후 새로고침. (1차엔 별도 로그인 UI 없음 — 미설정 시 모든 리포트 호출이 401이 되어 화면이 로딩 상태에 머뭅니다.)

## 보안 가정(1차)
1차 범위는 **신뢰된 내부 네트워크 배포**를 전제로 합니다. 짚어둘 점:
- `POST /ingest`는 **인증이 없습니다**(수집기가 토큰을 보내지 않음). 서버에 접근 가능한 누구나 임의의 `uploadedBy`로 가짜 사용량을 넣을 수 있습니다. 따라서 서버는 **내부 인터페이스에만 바인딩**하고 외부 노출을 막아야 합니다.
- CORS가 전체 허용(`enableCors()`)이며, `rawJson` 원본이 그대로 저장됩니다.
- 프롬프트 원문은 민감 정보이므로 관리자 전용 접근을 유지하세요.
- 토큰 집계는 로그된 모든 assistant 라인(서브에이전트/Task 사이드체인 포함)을 합산하므로, 사용자의 "메인 스레드" 체감보다 높게 보일 수 있습니다.

추후(2차): `/ingest` 인증·레이트리밋, CORS 화이트리스트, 토큰 입력 UI 등.

## 범위(1차)
Claude Code만, 관리자 전용, ~20명. Codex는 추후 파서 추가로 확장.
