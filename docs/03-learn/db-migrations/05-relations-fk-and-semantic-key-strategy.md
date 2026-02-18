# 05. Relations, FK, Semantic Key 운영 전략

## 핵심 질문

> Drizzle에서 relation/FK/semantic key를 어떻게 나눠야 운영이 편해지는가?

## 한 줄 답

관계 모델링을 버리는 것이 아니라, `relations(조회 모델)`과 `FK(저장 무결성)`와 `semantic key(업무 식별)`를 용도별로 분리해야 운영과 정합성을 동시에 얻는다.

---

## 현재 접근 방식

현재 구현(`apps/api/src/db/schema.ts`)은 다음 구조를 사용한다.

- 내부 식별: `id`(UUID) 중심
- DB 무결성: `.references(...)` FK + `check(...)`
- 조회 관계: `relations(...)` API
- 업무 의미 식별(후속 확장 대상): 주문번호, SKU, 외부 결제 식별자 같은 semantic key

즉, 지금은 "관계를 지우는" 방향이 아니라 "핵심 도메인 정합성은 DB에서 강제"하는 방향으로 설계되어 있다.

---

## `relations(...)`와 FK는 같은 기능이 아니다

**Problem** — Drizzle에서 `relations(...)`를 선언하면 FK를 대체한다고 오해하기 쉽다. 이 오해가 생기면 조회는 되지만 저장 무결성은 깨지는 스키마가 나온다.

```ts
// relations만 있고 FK가 없는 경우 (안티패턴)
const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull(),
})

const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}))
```

**Action** — 역할을 분리해서 선언한다.

```ts
const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
})

const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}))
```

**Result** — `relations(...)`는 타입 안전한 조인/탐색 모델을 담당하고, FK는 저장 시점의 정합성을 보장한다. 둘은 대체 관계가 아니라 보완 관계다.

---

## "FK는 운영이 불편하다"는 말의 정확한 범위

**Problem** — FK를 모든 경계에 걸면 대량 백필, 서비스 분리, 아카이빙 시 운영 부담이 급격히 커진다. 그래서 "FK를 다 빼자"는 극단으로 흐르기 쉽다.

```text
FK 과다 사용 시 흔한 문제
- 삭제/아카이브 순서 제약 증가
- 마이그레이션 윈도우 확대
- 경계(서비스/이벤트) 넘어선 참조 설계 난이도 상승
```

**Action** — 경계별로 FK 정책을 분리한다.

```text
FK 유지 (동일 트랜잭션 경계)
- orders -> order_items
- users -> user_sessions
- products -> inventory

FK 완화 (비동기/외부 경계)
- 외부 결제사 식별자
- 이벤트 소비 결과 로그
- 다른 bounded context의 데이터 참조
```

**Result** — 핵심 정합성은 보호하고, 경계 밖 통합은 유연하게 가져갈 수 있다. 운영 불편의 원인을 FK 자체가 아니라 "FK 적용 범위"로 다룰 수 있게 된다.

---

## semantic key는 FK의 대체제가 아니라 역할 분담 파트너

**Problem** — "요즘은 semantic key만 쓴다"는 문장을 literal하게 적용하면 내부 조인/업데이트 비용이 커지고, 자연키 변경 시 연쇄 수정이 발생한다.

```text
semantic key only
- 주문번호/이메일/SKU를 모든 조인 키로 사용
- 업무 규칙 변경 시 조인 키 자체가 흔들림
```

**Action** — 하이브리드 키 전략을 쓴다.

```text
내부 저장/조인: surrogate key (uuid id)
업무/외부 노출: semantic key (order_no, sku, external_payment_id)

권장 제약
- semantic key는 UNIQUE 인덱스로 보호
- 외부 연동/이벤트 payload에는 semantic key 사용
- 내부 트랜잭션 조인은 id/FK 중심 유지
```

**Result** — 내부 정합성과 외부 가독성을 동시에 확보한다. 도메인 의미를 살리면서도 스키마 변경 비용을 통제할 수 있다.

---

## 단계적 도입 전략 (현재 스키마 기준)

**Problem** — 이미 운영 중인 테이블에 키 전략을 한 번에 바꾸면 다운타임/데이터 정합성 리스크가 커진다.

**Action** — 무중단에 가까운 순서로 확장한다.

```text
1) add: nullable semantic key 컬럼 추가 (예: orders.order_no)
2) backfill: 기존 행 채우기
3) constraint: UNIQUE 인덱스/NOT NULL 추가
4) read switch: API/이벤트 조회를 semantic key 기반으로 확장
5) write policy: 내부 조인은 id/FK 유지, 외부 계약은 semantic key 표준화
```

**Result** — 현재 FK 기반 안전망을 유지한 채 semantic key를 점진 도입할 수 있다.

---

## 이 프로젝트에서의 적용

| 결정                                  | 해결하는 문제                                          |
| ------------------------------------- | ------------------------------------------------------ |
| `relations(...)`와 FK 역할 분리       | "조회 모델"과 "저장 무결성"의 책임 혼동 방지           |
| 경계별 FK 정책 (코어 유지, 외부 완화) | 운영 부담과 핵심 정합성 요구를 동시에 만족             |
| surrogate key + semantic key 병행     | 내부 조인 안정성과 외부 도메인 가독성을 함께 확보      |
| add -> backfill -> constraint 단계화  | 기존 데이터가 있는 환경에서 키 전략 변경 리스크 최소화 |

---

> **근거 문서**: [ADR-0002: Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택](../../02-architecture/backend/01-backend.adr.md)

---

## 참고 자료

- [Drizzle ORM - Relations](https://orm.drizzle.team/docs/relations)
- [Drizzle ORM - PostgreSQL column types (pgEnum)](https://orm.drizzle.team/docs/column-types/pg)
- [PostgreSQL - Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [PostgreSQL - Enum Types](https://www.postgresql.org/docs/current/datatype-enum.html)

---

## 이전 문서

[04. 시드, 백업, 복구 리허설](./04-seed-backup-and-restore-rehearsal.md) — DB 변경을 실패해도 복구 가능한 상태로 어떻게 유지하는가?
