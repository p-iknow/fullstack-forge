# Cart — API Spec Session

## Context

- **현재 상태**: Cart 관련 API spec 없음 (clean slate)
- **패턴 레퍼런스**:
  - Route contract: `packages/api-spec/src/routes/catalog/products/route.ts`
  - Domain schemas: `packages/api-spec/src/catalog-schemas.ts`
  - Route export: `packages/api-spec/src/routes/catalog/index.ts`
- **PRD 근거**: `docs/01-prd/04-cart/02-api.md`, `03-data.md`

## Scope

**이 세션에서 하는 것**:
- Cart Zod 스키마 정의
- Cart route contract 5개 정의
- Route export 등록

**이 세션에서 하지 않는 것**:
- DB 스키마 (02-db-schema에서)
- Backend handler 구현 (03-backend에서)
- Frontend (04-store-ui에서)

**생성할 파일**:
- `packages/api-spec/src/cart-schemas.ts`
- `packages/api-spec/src/routes/cart/cart/route.ts`
- `packages/api-spec/src/routes/cart/items/route.ts`
- `packages/api-spec/src/routes/cart/index.ts`

**수정할 파일**:
- `packages/api-spec/src/routes/index.ts` (cart export 추가)

## Progressive Tasks

### 1. Cart Zod 스키마 생성

파일: `packages/api-spec/src/cart-schemas.ts`

```typescript
export const cartStatusSchema = z.enum(['active', 'converted', 'expired'])
export const cartItemStockDisplaySchema = z.enum(['in_stock', 'low_stock', 'out_of_stock'])

export const cartItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  sku: z.string(),
  quantity: z.number().int().positive().max(15),
  unitPriceSnapshot: z.number().int().nonnegative(),
  isSubstitutable: z.boolean(),
  stockDisplay: cartItemStockDisplaySchema,
  availableStock: z.number().int().nonnegative(),
  thumbUrl: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const cartResponseSchema = z.object({
  id: z.string().uuid(),
  status: cartStatusSchema,
  itemCount: z.number().int().nonnegative(),
  totalAmount: z.number().int().nonnegative(),
  expiresAt: z.string().datetime(),
  version: z.number().int(),
  items: z.array(cartItemSchema),
})

export const addCartItemRequestSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(15),
})

export const updateCartItemRequestSchema = z.object({
  quantity: z.number().int().positive().max(15),
})

export const cartErrorSchema = z.object({
  code: z.string(),
  error: z.string(),
})

export const cartItemIdParamsSchema = z.object({
  cartItemId: z.string().uuid(),
})
```

### 2. Cart 조회/비우기 routes

파일: `packages/api-spec/src/routes/cart/cart/route.ts`

```typescript
// GET /api/store/cart → 200 cartResponse | 401
export const getCartRoute = createRoute({ ... })

// DELETE /api/store/cart → 204 | 401 | 409 cart_not_active
export const clearCartRoute = createRoute({ ... })
```

### 3. Cart items routes

파일: `packages/api-spec/src/routes/cart/items/route.ts`

```typescript
// POST /api/store/cart/items → 201 cartResponse | 400 | 401 | 409 | 422
export const addCartItemRoute = createRoute({ ... })

// PATCH /api/store/cart/items/{cartItemId} → 200 cartResponse | 400 | 404 | 409
export const updateCartItemRoute = createRoute({ ... })

// DELETE /api/store/cart/items/{cartItemId} → 200 cartResponse | 404 | 409
export const deleteCartItemRoute = createRoute({ ... })
```

### 4. Route index + 상위 export

파일: `packages/api-spec/src/routes/cart/index.ts` — 5개 route re-export
파일: `packages/api-spec/src/routes/index.ts` — `export * from './cart'` 추가

## Data Contract

### Endpoints

| Method | Path | Request | 성공 | 에러 코드 |
|--------|------|---------|------|-----------|
| GET | /api/store/cart | — | 200 cartResponse | 401 |
| POST | /api/store/cart/items | addCartItemRequest | 201 cartResponse | 400 `quantity_exceeded`, `max_items_exceeded` / 409 `cart_not_active`, `version_conflict` / 422 `product_unavailable` |
| PATCH | /api/store/cart/items/{cartItemId} | updateCartItemRequest | 200 cartResponse | 400 `quantity_exceeded` / 404 `item_not_found` / 409 `cart_not_active`, `version_conflict` |
| DELETE | /api/store/cart/items/{cartItemId} | — | 200 cartResponse | 404 `item_not_found` / 409 `cart_not_active` |
| DELETE | /api/store/cart | — | 204 | 409 `cart_not_active` |

### Error Codes

| code | 의미 | HTTP |
|------|------|------|
| `quantity_exceeded` | 아이템당 최대 15개 초과 — `04-cart/01-overview.md §2` | 400 |
| `max_items_exceeded` | 장바구니 최대 30항목 초과 — `04-cart/01-overview.md §2` | 400 |
| `product_unavailable` | 비활성/품절 상품 추가 시도 — `04-cart/02-api.md §4` | 422 |
| `cart_not_active` | converted/expired 장바구니 변경 시도 — `04-cart/01-overview.md §4` | 409 |
| `version_conflict` | 낙관적 락 충돌 — `04-cart/01-overview.md §5` | 409 |
| `item_not_found` | 존재하지 않는 cart_item_id | 404 |

## Verification

```bash
pnpm nx run @fullstack-forge/api-spec:codegen
pnpm nx run @fullstack-forge/api-spec:typecheck
```

## Exit Criteria

- [ ] cart-schemas.ts에 모든 Zod 스키마 정의
- [ ] 5개 route contract 정의 (GET cart, POST item, PATCH item, DELETE item, DELETE cart)
- [ ] 모든 에러 응답에 code + error 스키마 지정
- [ ] codegen 성공
- [ ] typecheck 통과
