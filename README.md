# AI Usage Report

회사 내부 인원들의 **AI 코딩 도구(Claude Code) 사용 현황**을 관리자가 한눈에 볼 수 있는 웹 서비스입니다.

각 개발자 PC의 Claude Code 로그(`~/.claude/projects/**/*.jsonl`)를 수집해, 다음 3가지 리포트를 제공합니다.

1. **이용자별 프롬프트 이력** — 누가 언제 어떤 프롬프트를 보냈는지 원문 포함 조회
2. **일별 프롬프트 수** — 사용자·날짜별 프롬프트 카운트 추이
3. **토큰 사용량** — input / output / cache 토큰을 일별·사용자별·모델별로 집계

> 1차 범위: **Claude Code만**, **관리자 전용**, **~20명** 규모. (Codex 등은 파서 추가로 확장 가능)

---

## 아키텍처

```
개발자 PC ×N                         서버 (NestJS + Postgres)
  ~/.claude/projects/*.jsonl
       │                            ┌────────────┐   ┌─────────────┐
  ┌─────────┐  HTTPS(새 줄 배치)      │ Ingest API │──▶│ raw_uploads │
  │collector│ ─────────────────────▶ │ (원본 저장) │   │  (원본 보존) │
  │ (cron)  │                        └────────────┘   └──────┬──────┘
  │ +offset │                                                │
  └─────────┘                        ┌────────────┐    파싱/정규화
                                     │  Parser    │◀─────────┘
관리자 브라우저                        │  Worker    │──▶ users / sessions / messages
  React 대시보드 ◀─ HTTPS ─▶ Report API ◀── 집계 SQL(GROUP BY) ──┘
                         (x-admin-token)
```

- **수집기(Collector)** 는 jsonl을 파싱하지 않고 **새로 추가된 줄만** 원본 그대로 서버로 업로드합니다. 파싱·집계는 전부 서버에서 수행하므로, 파서를 개선해도 PC들을 재배포할 필요 없이 원본을 재처리하면 됩니다.
- **멱등성**: 업로드 라인은 `sha256(line)` UNIQUE로, 메시지는 라인 `uuid` PK로 중복을 차단합니다. 재수집·재파싱이 토큰을 이중 집계하거나 데이터를 잃지 않습니다.

---

## 모노레포 구성

```
.
├── apps/
│   ├── server/      # NestJS + TypeORM + PostgreSQL (Ingest / Parser / Reports)
│   ├── web/         # React + Vite + TypeScript 관리자 대시보드
│   └── collector/   # 각 PC에서 cron으로 실행하는 Node 수집기 CLI
├── docker-compose.yml   # 로컬 Postgres 16
└── pnpm-workspace.yaml
```

### 기술 스택
- **서버**: NestJS, TypeORM, PostgreSQL 16
- **웹**: React, Vite, TypeScript, TanStack Query, Recharts, Tailwind CSS
- **수집기**: Node.js (TypeScript), undici
- **공통**: pnpm workspace, Node.js ≥ 20

---

## 빠른 시작 (로컬)

사전 요구: Node.js ≥ 20, pnpm, Docker.

```bash
# 1) 의존성 설치
pnpm install

# 2) Postgres 기동
pnpm db:up

# 3) 서버 (마이그레이션 후 기동)
cd apps/server
cp .env.example .env          # DATABASE_URL, ADMIN_TOKEN 설정
pnpm migration:run
pnpm start                    # http://localhost:3000

# 4) 대시보드 (별도 터미널)
cd apps/web
pnpm dev                      # http://localhost:5173 (/api → :3000 프록시)

# 5) 각 개발자 PC: 수집기 설정 후 cron 등록
cd apps/collector
cp .env.example .env          # INGEST_URL, UPLOADED_BY 설정
pnpm build
# 예) 30분마다 수집
# */30 * * * * cd /path/apps/collector && node -r dotenv/config dist/index.js
```

---

## 설정

### 서버 (`apps/server/.env`)
| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | Postgres 연결 문자열 |
| `PORT` | 서버 포트 (기본 3000) |
| `ADMIN_TOKEN` | 리포트 API 보호 토큰 |

### 수집기 (`apps/collector/.env`)
| 변수 | 설명 |
|---|---|
| `INGEST_URL` | 서버 Ingest 엔드포인트 (예: `http://server:3000/ingest`) |
| `UPLOADED_BY` | 해당 PC 사용자 식별값(email/사번) |
| `CLAUDE_DIR` | jsonl 경로 (기본 `~/.claude/projects`) |

### 관리자 토큰 (대시보드)
리포트 API(`/reports/*`)는 `x-admin-token` 헤더로 보호되며, 토큰 미설정/불일치 시 **401**(fail-closed)입니다.
브라우저에서 다음을 실행 후 새로고침하세요. (1차엔 별도 로그인 UI 없음)
```js
localStorage.setItem('adminToken', '<ADMIN_TOKEN 값>')
```

---

## 리포트 화면

- **개요** — 전체 KPI(프롬프트/토큰/활성 사용자), 일별 프롬프트·토큰 차트, 사용자 랭킹
- **사용자별 상세** — 선택 사용자의 일별 추이, 모델별 토큰, 프로젝트별 사용량
- **프롬프트 이력** — 사용자/기간/프로젝트/키워드 필터, 원문 펼쳐보기, 커서 페이지네이션
- **토큰 사용량** — 일별/사용자별/모델별 집계, 토큰 분해(input·output·cache), CSV 내보내기

---

## 테스트

```bash
cd apps/server && pnpm test       # NestJS 통합 테스트 (Postgres 필요)
cd apps/collector && pnpm test    # 수집기 단위 테스트
cd apps/web && pnpm vite build    # 빌드 검증
```

> 서버 테스트는 공유 Postgres를 사용하므로 직렬 실행(`maxWorkers: 1`)이며, 각 스펙이 자신의 픽스처를 정리해 반복 실행에도 결정적으로 동작합니다.

---

## 보안 가정 (1차)

1차 범위는 **신뢰된 내부 네트워크 배포**를 전제로 합니다.

- `POST /ingest`는 **인증이 없습니다**(수집기가 토큰을 보내지 않음). 서버에 접근 가능한 누구나 임의의 `uploaded_by`로 사용량을 넣을 수 있으므로, 서버는 **내부 인터페이스에만 바인딩**하고 외부 노출을 막아야 합니다.
- CORS가 전체 허용 상태이며, 업로드 원문(`raw_json`)이 그대로 저장됩니다.
- 프롬프트 원문은 민감 정보이므로 관리자 전용 접근을 유지하세요.
- 토큰 집계는 로그된 모든 assistant 라인(서브에이전트/Task 사이드체인 포함)을 합산하므로, "메인 스레드" 체감보다 높게 보일 수 있습니다.

추후(2차) 권장: `/ingest` 인증·레이트리밋, CORS 화이트리스트, 토큰 입력 UI, 응답 타입 정의.
