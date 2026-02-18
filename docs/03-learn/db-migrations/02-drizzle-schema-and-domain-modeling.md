# 02. Drizzle 스키마와 도메인 모델링

## 핵심 질문

> 스키마 코드가 비즈니스 정책을 어떻게 강제하는가?

## 한 줄 답

`schema.ts`의 enum, FK, relation, check constraint를 조합하면 "문서에 적힌 정책"을 "DB가 거부/허용하는 규칙"으로 바꿀 수 있다.

---

## 현재 접근 방식

현재 구현은 `apps/api/src/db/schema.ts`를 단일 진입점으로 사용한다.

- 인증/권한 도메인: `users`, `user_credentials`, `user_oauth_accounts`, `user_sessions`, `audit_logs`
- 커머스 도메인: `products`, `inventory`, `orders`, `order_items`, `payments`, `deliveries`, `substitutions`, `reviews`, `review_comments`, `customer_inquiries`, `inquiry_replies`
- 상태 표현: `pgEnum(...)` 12종
- 관계 표현: `relations(...)`로 one/many 명시
- 불변식: `inventory_reserved_lte_on_hand_chk` 등 `check(...)`

---

## `pgEnum` — 상태 공간을 DB 수준에서 제한

**Problem** — 상태를 단순 문자열로 저장하면 오타/불법 값이 들어가도 런타임까지 모른다.

```ts
// without enum
status: text('status').notNull()
// -> 'paied', 'delivred' 같은 오타 값이 저장될 수 있음
```

**Action** — 주문/결제/배송/계정 상태를 enum 타입으로 선언한다.

```ts
const orderStatusEnum = pgEnum('order_status', [
  'created',
  'paid',
  'picking',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'failed',
])
```

**Result** — 허용되지 않은 값은 DB에 저장 자체가 불가능해진다. PRD 상태 집합과 저장소 상태 집합이 일치한다.

> **Caveat**: enum 값 변경은 마이그레이션 작업이 필요하므로, 자주 바뀌는 값 집합에는 lookup table이 더 나을 수 있다.

---

## FK + `relations(...)` — 데이터 연결 규칙을 코드/쿼리 양쪽에서 일치

**Problem** — 조인 규칙이 코드마다 다르면 API마다 다른 데이터 그림을 만들고, 고아 레코드(부모 없는 자식)가 누적된다.

```ts
// without FK
orderId: uuid('order_id').notNull()
// -> 존재하지 않는 주문 ID를 참조해도 저장 가능
```

**Action** — FK를 선언하고, Drizzle relations API로 탐색 방향을 명시한다.

```ts
const orderItems = pgTable('order_items', {
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
})

const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}))
```

**Result** — 저장 단계에서 참조 무결성이 강제되고, 조회 단계에서 관계 탐색 코드가 일관된 구조를 갖는다.

---

## `check(...)` 제약 — 재고 불변식의 마지막 안전망

**Problem** — 애플리케이션 로직만으로 재고를 검증하면 경합 상황에서 음수 재고가 저장될 수 있다.

```sql
-- without DB check
reserved = 9, on_hand = 5
-- 애플리케이션 버그/동시성 이슈 시 저장 가능
```

**Action** — inventory 테이블에 check constraint를 추가해 DB가 직접 차단한다.

```ts
check('inventory_reserved_lte_on_hand_chk', sql`${table.reserved} <= ${table.onHand}`)
```

**Result** — 잘못된 계산이 API 레이어를 통과해도 최종 저장소에서 거부된다. 재고 도메인에서 중요한 방어선이다.

---

## 이 프로젝트에서의 적용

| 결정                     | 해결하는 문제                                      |
| ------------------------ | -------------------------------------------------- |
| `pgEnum` 상태 정의       | 상태 오타/불법 상태값 저장으로 인한 정책 위반 차단 |
| FK + `relations(...)`    | 참조 무결성 붕괴와 조인 코드 불일치 문제 축소      |
| `check` 기반 재고 불변식 | 경합/버그 상황의 음수 재고 및 불일치 저장 차단     |

---

> **근거 문서**: [ADR-0002: Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택](../../02-architecture/backend/01-backend.adr.md)

---

## 다음 문서

[03. 마이그레이션 생성·적용 루프](./03-migration-generation-and-apply-loop.md) — 스키마 변경을 어떻게 SQL 이력으로 안전하게 관리하는가?
