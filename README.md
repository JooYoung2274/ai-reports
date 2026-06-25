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

## 범위(1차)
Claude Code만, 관리자 전용, ~20명. Codex는 추후 파서 추가로 확장.
