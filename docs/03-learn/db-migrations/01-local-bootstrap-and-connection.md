# 01. 로컬 DB 부트스트랩과 연결 구조

## 핵심 질문

> 백엔드 입문에서 DB 연결 루프를 가장 먼저 고정해야 하는 이유는?

## 한 줄 답

DB 연결 루프(`컨테이너 기동 -> 연결 확인 -> 앱 헬스체크`)가 고정되지 않으면 이후 스키마/마이그레이션 학습이 모두 불안정해진다.

---

## 현재 흐름

```text
1) pnpm --filter @fullstack-forge/api db:pg:start
   -> apps/api/scripts/postgres-local.sh
   -> postgres:16 컨테이너 기동/재시작

2) pnpm --filter @fullstack-forge/api db:pg:ready
   -> docker exec ... pg_isready
   -> DB 수신 가능 여부 확인

3) API 실행
   -> apps/api/src/db/client.ts에서 Pool 생성
   -> drizzle({ client: pool, schema }) 바인딩

4) /health 호출
   -> apps/api/src/routes/health/health.index.ts
   -> db.execute(select 1) 성공 시 status=ok
```

---

## `db:pg:start` + `db:pg:ready` — 로컬 환경 결정론 확보

**Problem** — 프론트엔드 중심 개발에서는 API만 켜고 바로 작업하려는 습관이 있다. 이때 DB 준비 상태가 매번 달라져 `connection refused`, `database does not exist` 같은 환경성 실패가 반복된다.

```bash
# DB 미기동 상태에서 바로 마이그레이션 실행
pnpm --filter @fullstack-forge/api db:migrate
# -> connect ECONNREFUSED
```

**Action** — `apps/api/scripts/postgres-local.sh`로 DB 준비 단계를 스크립트화했다.

```bash
pnpm --filter @fullstack-forge/api db:pg:start
pnpm --filter @fullstack-forge/api db:pg:ready
```

**Result** — 로컬마다 다른 수동 실행 절차를 제거하고, DB 준비 여부를 명시적으로 검증한 뒤 다음 단계로 넘어갈 수 있다. 2026년 기준으로도 Docker 기반 로컬 부트스트랩은 팀 협업의 기본 패턴이다.

---

## `Pool` + `drizzle` 바인딩 — 연결 관리와 타입 안전 동시 확보

**Problem** — 단일 커넥션 방식은 요청이 늘어나면 연결 경합이 발생하고, ORM 미바인딩 상태에서는 스키마 타입 추론 이점이 사라진다.

```ts
// without pool/schema binding
import { Client } from 'pg'

const client = new Client({ connectionString: process.env.DATABASE_URL! })
// 요청마다 connect/disconnect를 반복하거나, 스키마 타입 정보를 잃기 쉽다
```

**Action** — `apps/api/src/db/client.ts`에서 `pg.Pool`과 Drizzle schema를 함께 바인딩한다.

```ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '~/db/schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const db = drizzle({ client: pool, schema })
```

**Result** — 연결 재사용으로 안정적인 런타임 동작을 확보하고, schema 기반 타입 추론으로 쿼리 작성 실수를 컴파일 단계에서 줄인다.

---

## `/health`에서 DB ping — "앱은 켜졌는데 DB는 죽은" 상태 차단

**Problem** — 프로세스가 떠 있다는 사실과 DB를 실제로 사용할 수 있다는 사실은 다르다. 앱 부팅만 확인하면 장애를 늦게 발견한다.

```ts
// without db ping
healthRoute.get('/', (c) => c.json({ status: 'ok' }))
```

**Action** — `/health`에서 `select 1`을 수행해 DB 왕복 성공을 헬스 기준으로 삼는다.

```ts
healthRoute.get('/', async (c) => {
  await db.execute(sql`select 1`)
  return c.json({ status: 'ok' })
})
```

**Result** — API 프로세스와 DB 연결 상태를 함께 검증할 수 있어, 운영 관점에서 의미 있는 헬스체크가 된다.

---

## 이 프로젝트에서의 적용

| 결정                           | 해결하는 문제                                      |
| ------------------------------ | -------------------------------------------------- |
| `db:pg:start`/`db:pg:ready`    | 로컬 환경 준비 상태의 불일치로 인한 반복 실패 차단 |
| `Pool` + Drizzle schema 바인딩 | 연결 안정성과 타입 안전 쿼리 기반 확보             |
| `/health`의 DB ping            | 프로세스 생존과 실제 DB 사용 가능 상태를 분리 검증 |

---

> **근거 문서**: [ADR-0002: Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택](../../02-architecture/backend/01-backend.adr.md)

---

## 다음 문서

[02. Drizzle 스키마와 도메인 모델링](./02-drizzle-schema-and-domain-modeling.md) — 스키마 코드가 비즈니스 정책을 어떻게 강제하는가?
