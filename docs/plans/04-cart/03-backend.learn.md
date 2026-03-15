# Cart — Backend Session: Learnings

## 구현 요약

- `apps/api/src/routes/cart/@shared/cart-helpers.ts` — getOrCreateActiveCart, refreshCartExpiry, loadCartWithItems, validateProductPurchasable
- `apps/api/src/routes/cart/handlers.ts` — 5개 handler (getCart, addCartItem, updateCartItem, deleteCartItem, clearCart)
- `apps/api/src/routes/cart/index.ts` — route 등록 + requireAuth 미들웨어
- `apps/api/src/routes/cart/handlers.test.ts` — 14개 테스트 케이스
- `apps/api/src/app.ts` — `app.route('/cart', cartIndex)` 등록

## 배운 점

### 1. Subrouter 마운트 경로와 미들웨어 스코프

**문제**: `app.route('/', cartIndex)` + `cartIndex.use('*', requireAuth)` 조합에서 `*` 패턴이 `/openapi.json`까지 잡아 codegen이 401로 실패했다.

**해결**: admin 패턴을 따라 `app.route('/cart', cartIndex)`로 마운트하고 route path에서 `/cart` prefix를 제거. `use('*', requireAuth)`가 `/cart/*` 범위에서만 동작하게 됨.

**교훈**: Hono의 subrouter에서 `use('*', ...)` 미들웨어는 마운트 포인트 하위 전체에 적용된다. `/`에 마운트하면 앱 전체에 적용되는 셈이므로, 인증이 필요한 도메인은 반드시 고유 prefix에 마운트해야 한다.

### 2. 낙관적 락(Optimistic Lock) 구현

```typescript
const result = await db
  .update(carts)
  .set({ version: sql`${carts.version} + 1`, expiresAt, updatedAt: now })
  .where(and(eq(carts.id, cartId), eq(carts.version, currentVersion)))
```

`WHERE version = currentVersion` 조건으로 동시 수정을 감지. 영향 행이 0이면 다른 요청이 먼저 수정한 것이므로 409 version_conflict를 반환. 이 패턴은 DB 락 없이도 동시성 충돌을 안전하게 처리한다.

### 3. Upsert 패턴 — 동일 상품 재추가

장바구니에 동일 상품을 다시 추가할 때 새 행을 만들지 않고 기존 행의 수량을 합산한다. Drizzle의 `onConflictDoUpdate`는 INSERT 기반이지만, 여기서는 합산 로직과 비즈니스 검증(15개 초과 체크)이 필요하므로 SELECT → UPDATE 2단계로 구현.

### 4. Stock Display 계산 — DB JOIN + 앱 로직

재고 상태(in_stock, low_stock, out_of_stock)는 DB에 저장하지 않고 매 조회 시 계산한다:

```
available = inventory.onHand - inventory.reserved
available <= 0              → 'out_of_stock'
available <= safetyThreshold → 'low_stock'
else                        → 'in_stock'
```

이유: 재고는 주문/배송/입고 등 외부 이벤트에 의해 수시로 변하므로 캐시하면 정합성 문제가 생긴다. 매 조회 계산이 단순하고 정확하다.

### 5. Handler 테스트 패턴 — vi.hoisted + 상태 객체

```typescript
const dbState = {
  selectQueue: [] as unknown[][],
  insertReturning: [] as unknown[],
  updateRowCount: 1,
  deleteRowCount: 1,
}
```

`vi.hoisted()`로 상태 객체를 모듈 스코프 최상위에 선언하면 `vi.mock()` 내부에서 참조할 수 있다. 테스트마다 `beforeEach`에서 상태를 리셋하고, given 절에서 시나리오별 데이터를 push. `selectQueue`는 큐 방식(shift)으로 순차 쿼리 결과를 시뮬레이션한다.

### 6. RouteHandler 타입 추론

```typescript
export const getCartHandler: RouteHandler<typeof getCartRoute> = async (c) => { ... }
```

`RouteHandler<typeof route>`를 사용하면 `c.req.valid('json')`, `c.req.valid('param')` 등의 반환 타입이 route definition의 request schema에서 자동 추론된다. 이 타입 안전성이 runtime validation(Zod)과 결합되어 contract-first 개발을 보장한다.
