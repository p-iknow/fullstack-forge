# 03. 마이그레이션 생성·적용 루프

## 핵심 질문

> 스키마 변경을 어떻게 SQL 이력으로 안전하게 관리하는가?

## 한 줄 답

`schema.ts` 변경을 바로 DB에 반영하지 않고 `db:generate -> SQL 리뷰 -> db:migrate` 순서로 분리하면, 변경 이력을 코드 리뷰 가능한 자산으로 만들 수 있다.

---

## 현재 흐름

```text
1) schema.ts 수정
2) pnpm --filter @fullstack-forge/api db:generate
   -> drizzle/0000_*.sql 생성
   -> drizzle/meta/_journal.json 갱신
3) 생성 SQL 리뷰 (enum/FK/check/DDL 확인)
4) pnpm --filter @fullstack-forge/api db:migrate
   -> DB에 DDL 적용
5) typecheck/lint/format + 실행 체크리스트 검증
```

---

## `db:generate` vs `db:migrate` 한눈에 보기

두 명령은 이름이 비슷하지만 책임이 다르다.

| 명령          | 하는 일                                  | 바뀌는 대상                   | 실패했을 때 의미                        |
| ------------- | ---------------------------------------- | ----------------------------- | --------------------------------------- |
| `db:generate` | `schema.ts`를 읽어 마이그레이션 SQL 생성 | `apps/api/drizzle/*.sql` 파일 | 스키마 정의/설정 문제 가능성            |
| `db:migrate`  | 생성된 SQL을 실제 DB에 적용              | PostgreSQL 실제 테이블/제약   | DB 상태/권한/충돌/적용 순서 문제 가능성 |

```text
short mental model
db:generate = "설계도를 SQL 파일로 만든다"
db:migrate  = "그 SQL 파일을 실제 DB에 시공한다"
```

```bash
# 1) SQL 파일 생성 (파일 시스템 변경)
pnpm --filter @fullstack-forge/api db:generate

# 2) SQL 적용 (DB 상태 변경)
pnpm --filter @fullstack-forge/api db:migrate
```

---

## `drizzle.config.ts` 분리 — 생성기 입력을 명시적으로 고정

**Problem** — 생성기 입력 경로/연결 정보가 코드 곳곳에 흩어지면 팀원마다 다른 SQL이 생성되어 마이그레이션 충돌이 잦아진다.

```ts
// no single source of migration config
// 사람마다 schema 경로/출력 경로를 다르게 해석할 수 있음
```

**Action** — `apps/api/drizzle.config.ts`에서 스키마 경로, 출력 경로, DB 연결 정보를 고정한다.

```ts
export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
  verbose: true,
})
```

**Result** — 누구가 실행해도 동일한 입력으로 동일한 마이그레이션 결과를 생성한다. 협업 시 재현성이 높아진다.

---

## `db:generate` 우선 — 변경을 "SQL diff"로 외부화

**Problem** — 코드만 보고는 실제 DB에 어떤 DDL이 적용되는지 놓치기 쉽다.

```text
schema.ts 변경만 리뷰
-> 실제 CREATE TYPE/ALTER TABLE 영향은 런타임까지 확인이 어려움
```

**Action** — 먼저 `db:generate`로 SQL 파일을 만든 뒤, SQL을 리뷰하고 나서 적용한다.

```bash
pnpm --filter @fullstack-forge/api db:generate
# drizzle/0000_rich_the_order.sql 생성
```

**Result** — schema 변경이 SQL 변경으로 가시화되어 코드 리뷰 품질이 올라간다. "무엇이 DB에 적용되는가"를 PR 단계에서 확인할 수 있다.

---

## `db:migrate` 분리 적용 — 실패 지점을 명확히 식별

**Problem** — 생성과 적용을 한 번에 처리하면 실패 원인이 "스키마 정의 문제"인지 "실제 DB 적용 문제"인지 분리하기 어렵다.

```bash
# generate/apply가 뒤섞인 흐름
# 실패 시 원인 분석 범위가 넓어짐
```

**Action** — 생성 성공 후에만 적용 단계로 진행한다.

```bash
pnpm --filter @fullstack-forge/api db:migrate
```

**Result** — 실패 지점을 단계별로 좁힐 수 있고, 복구 절차를 단계별로 대응하기 쉬워진다.

---

## 이 프로젝트에서의 적용

| 결정                       | 해결하는 문제                                         |
| -------------------------- | ----------------------------------------------------- |
| `drizzle.config.ts` 중앙화 | 팀원별 생성기 입력 차이로 인한 마이그레이션 충돌 감소 |
| `db:generate` 우선         | DB 변경 내용을 SQL diff로 사전 검증 가능              |
| `db:migrate` 단계 분리     | 실패 원인 분석/복구 범위 축소                         |

---

> **근거 문서**: [ADR-0002: Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택](../../02-architecture/backend/01-backend.adr.md)

---

## 다음 문서

[04. 시드, 백업, 복구 리허설](./04-seed-backup-and-restore-rehearsal.md) — DB 변경을 실패해도 복구 가능한 상태로 어떻게 유지하는가?
