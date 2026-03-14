# Cart — Backend Session

## Context

- **현재 상태**: API spec + DB schema 완료 (01, 02 세션). 핸들러 없음.
- **패턴 레퍼런스**:
  - Route 등록: `apps/api/src/routes/catalog/index.ts`
  - Handler: `apps/api/src/routes/catalog/handlers.ts`
  - Auth middleware: `apps/api/src/routes/auth/@shared/http/middleware.ts`
  - App 등록: `apps/api/src/app.ts`
  - Test: `apps/api/src/routes/auth/login/handler.test.ts`
- **PRD 근거**: `docs/01-prd/04-cart/01-overview.md §2-5`, `02-api.md`

## Scope

**이 세션에서 하는 것**:
- Cart route 등록 (index.ts)
- 5개 handler 구현 (getCart, addItem, updateItem, deleteItem, clearCart)
- getOrCreateCart, loadCartWithItems, validateProductPurchasable 헬퍼
- 낙관적 락 (version) 검증
- Handler 테스트
- app.ts 등록

**이 세션에서 하지 않는 것**:
- TTL 배치 만료 (별도 세션 또는 이벤트 인프라 이후)
- CartConverted 이벤트 발행 (06-order-payment에서)
- Frontend (04-store-ui에서)

**생성할 파일**:
- `apps/api/src/routes/cart/index.ts`
- `apps/api/src/routes/cart/handlers.ts`
- `apps/api/src/routes/cart/@shared/cart-helpers.ts`
- `apps/api/src/routes/cart/handlers.test.ts`

**수정할 파일**:
- `apps/api/src/app.ts` (cart route 추가)

## Progressive Tasks

### 1. Cart helpers

파일: `apps/api/src/routes/cart/@shared/cart-helpers.ts`

```typescript
// getOrCreateActiveCart(userId: string)
//   1. SELECT carts WHERE userId AND status='active'
//   2. 있으면 반환, 없으면 INSERT (expiresAt = now+7일)

// refreshCartExpiry(cartId: string, currentVersion: number)
//   1. UPDATE carts SET expires_at=now+7일, last_active_at=now, version=version+1
//      WHERE id=cartId AND version=currentVersion
//   2. 영향 행 0 → version_conflict 에러

// loadCartWithItems(cartId: string)
//   1. carts + cartItems + products + inventory LEFT JOIN
//   2. stockDisplay 계산:
//      available = onHand - reserved
//      available <= 0 → out_of_stock
//      available <= safetyThreshold → low_stock
//      else → in_stock
//   3. totalAmount = SUM(unitPriceSnapshot * quantity)

// validateProductPurchasable(productId: string)
//   1. product.isActive=true, category.isActive=true, available > 0
//   2. 실패 시 throw { code: 'product_unavailable' }
```

### 2. Handlers

파일: `apps/api/src/routes/cart/handlers.ts`

#### GET /api/store/cart
```
1. requireAuth → userId
2. getOrCreateActiveCart(userId)
3. loadCartWithItems(cart.id)
4. return c.json(cartResponse, 200)
```

#### POST /api/store/cart/items
```
1. requireAuth → userId
2. body: { productId, quantity }
3. getOrCreateActiveCart(userId) → cart
4. cart.status !== 'active' → 409 cart_not_active
5. validateProductPurchasable(productId)
6. 기존 item 확인: cartItems WHERE cartId AND productId
7. 기존 있으면: newQty = existing.quantity + body.quantity
   newQty > 15 → 400 quantity_exceeded — §2
   UPDATE cartItems SET quantity=newQty
8. 기존 없으면: COUNT(cartItems) >= 30 → 400 max_items_exceeded — §2
   INSERT cartItem (unitPriceSnapshot=product.price, isSubstitutable)
9. refreshCartExpiry(cart.id, cart.version)
10. loadCartWithItems(cart.id) → return 201
```

#### PATCH /api/store/cart/items/{cartItemId}
```
1. requireAuth → userId
2. cartItem + cart JOIN, cart.userId = userId 확인
3. cart.status !== 'active' → 409 cart_not_active
4. cartItem 없음 → 404 item_not_found
5. quantity > 15 → 400 quantity_exceeded
6. UPDATE cartItems SET quantity
7. refreshCartExpiry → loadCartWithItems → return 200
```

#### DELETE /api/store/cart/items/{cartItemId}
```
1. requireAuth → userId
2. cartItem + cart JOIN, userId 확인
3. cart.status !== 'active' → 409 cart_not_active
4. cartItem 없음 → 404 item_not_found
5. DELETE cartItems WHERE id
6. refreshCartExpiry → loadCartWithItems → return 200
```

#### DELETE /api/store/cart
```
1. requireAuth → userId
2. cart 조회, userId 확인
3. cart.status !== 'active' → 409 cart_not_active
4. DELETE cartItems WHERE cartId
5. refreshCartExpiry → return 204
```

### 3. Route 등록

파일: `apps/api/src/routes/cart/index.ts`

```typescript
export const cartIndex = createRouter()
cartIndex.use('*', requireAuth)
cartIndex.openapi(getCartRoute, getCartHandler)
cartIndex.openapi(addCartItemRoute, addCartItemHandler)
// ... 5개 전부 등록
```

### 4. App 등록

파일: `apps/api/src/app.ts` — `app.route('/', cartIndex)` 추가

### 5. Handler 테스트

파일: `apps/api/src/routes/cart/handlers.test.ts`

```
describe('GET /api/store/cart')
  - 활성 장바구니 없으면 자동 생성 후 빈 장바구니 반환
  - 기존 장바구니 + items 반환, stockDisplay 포함

describe('POST /api/store/cart/items')
  - 새 상품 추가 성공 → 201
  - 동일 상품 재추가 → 수량 합산 (upsert)
  - 합산 후 15 초과 → 400 quantity_exceeded
  - 장바구니 30항목 → 400 max_items_exceeded
  - 비활성 상품 → 422 product_unavailable
  - converted 장바구니 → 409 cart_not_active

describe('PATCH /api/store/cart/items/{cartItemId}')
  - 수량 변경 성공 → 200
  - 15 초과 → 400 quantity_exceeded
  - 없는 항목 → 404 item_not_found

describe('DELETE /api/store/cart/items/{cartItemId}')
  - 삭제 성공 → 200
  - 없는 항목 → 404

describe('DELETE /api/store/cart')
  - 전체 비우기 성공 → 204
  - converted 장바구니 → 409
```

테스트 구조: vi.hoisted + vi.mock db + given/when/then

## Data Contract

### Business Rules

| 규칙 | 값 | 검증 시점 | PRD 근거 |
|------|------|-----------|----------|
| 아이템당 최대 수량 | 15 | POST (합산), PATCH | `01-overview.md §2` |
| 장바구니 최대 항목 | 30 | POST (새 항목일 때) | `01-overview.md §2` |
| TTL | 7일 | 생성 시 설정, 변경 시 갱신 | `01-overview.md §2` |
| 활성 장바구니 | 사용자당 1개 | getOrCreate에서 보장 | `01-overview.md §2` |
| 낙관적 락 | version 필드 | refreshCartExpiry에서 검증 | `01-overview.md §5` |
| 가격 스냅샷 | 추가 시점 가격 | POST (신규 아이템) | `01-overview.md §2` |

### Stock Display 계산

```
available = inventory.onHand - inventory.reserved
available <= 0              → 'out_of_stock'
available <= safetyThreshold → 'low_stock'
else                        → 'in_stock'
```

## Verification

```bash
pnpm nx run @fullstack-forge/api:typecheck
pnpm nx run @fullstack-forge/api:test
pnpm nx run @fullstack-forge/api:build
```

## Exit Criteria

- [ ] 5개 endpoint 모두 정상 동작
- [ ] 동일 상품 재추가 → 수량 합산 (upsert)
- [ ] 아이템당 최대 15, 장바구니 최대 30 제한
- [ ] 비활성/품절 상품 추가 거부 (422)
- [ ] converted/expired 장바구니 변경 거부 (409)
- [ ] 낙관적 락 version conflict 반환 (409)
- [ ] 실시간 재고 stockDisplay 계산
- [ ] requireAuth middleware 적용
- [ ] 테스트 전체 통과
- [ ] typecheck/build 통과
