# Cart — DB Schema Session

## Context

- **현재 상태**: Cart DB 스키마 없음 (clean slate)
- **패턴 레퍼런스**:
  - pgTable + enum: `apps/api/src/db/schema/product.ts`
  - Relations: `apps/api/src/db/schema/relations.ts`
  - Barrel export: `apps/api/src/db/schema/index.ts`
- **PRD 근거**: `docs/01-prd/04-cart/03-data.md`, `01-overview.md §2,4,5`

## Scope

**이 세션에서 하는 것**:

- `cartStatusEnum` 정의
- `carts` 테이블 정의
- `cartItems` 테이블 정의
- Relations 추가
- Barrel export 추가

**이 세션에서 하지 않는 것**:

- API spec (01-api-spec에서 완료)
- Backend handler (03-backend에서)
- Frontend (04-store-ui에서)

**생성할 파일**:

- `apps/api/src/db/schema/cart.ts`

**수정할 파일**:

- `apps/api/src/db/schema/relations.ts` (cart relations 추가)
- `apps/api/src/db/schema/index.ts` (cart export 추가)

## Progressive Tasks

### 1. Cart enum + tables

파일: `apps/api/src/db/schema/cart.ts`

```typescript
export const cartStatusEnum = pgEnum('cart_status', ['active', 'converted', 'expired'])

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    status: cartStatusEnum('status').notNull().default('active'),
    version: integer('version').notNull().default(1),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_carts_user_active')
      .on(table.userId)
      .where(sql`status = 'active'`),
  ],
)

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitPriceSnapshot: integer('unit_price_snapshot').notNull(),
    isSubstitutable: boolean('is_substitutable').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('uq_cart_items_cart_product').on(table.cartId, table.productId)],
)
```

### 2. Relations 추가

파일: `apps/api/src/db/schema/relations.ts`

```typescript
// Cart 1:N CartItem
// CartItem N:1 Product
// User 1:0..1 Cart(active)
export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}))
```

### 3. Barrel export

파일: `apps/api/src/db/schema/index.ts` — `export * from './cart'` 추가

## Data Contract

### DB Columns — carts

| 컬럼         | 타입          | 제약                       | 설명                                          |
| ------------ | ------------- | -------------------------- | --------------------------------------------- |
| id           | uuid          | PK, defaultRandom          | 장바구니 ID                                   |
| userId       | uuid          | NOT NULL, FK→users         | 소유 사용자                                   |
| status       | cart_status   | NOT NULL, default 'active' | 장바구니 상태 — `03-data.md §2`               |
| version      | integer       | NOT NULL, default 1        | 낙관적 락 — `01-overview.md §5`               |
| expiresAt    | timestamp(tz) | NOT NULL                   | TTL 만료 시각 (now+7일) — `01-overview.md §2` |
| lastActiveAt | timestamp(tz) | NOT NULL, defaultNow       | 마지막 활동 시각                              |
| createdAt    | timestamp(tz) | NOT NULL, defaultNow       | 생성 시각                                     |
| updatedAt    | timestamp(tz) | NOT NULL, defaultNow       | 수정 시각                                     |

Indexes: `uq_carts_user_active` — UNIQUE(user_id) WHERE status='active'

### DB Columns — cart_items

| 컬럼              | 타입          | 제약                        | 설명                                 |
| ----------------- | ------------- | --------------------------- | ------------------------------------ |
| id                | uuid          | PK, defaultRandom           | 항목 ID                              |
| cartId            | uuid          | NOT NULL, FK→carts, CASCADE | 소속 장바구니                        |
| productId         | uuid          | NOT NULL, FK→products       | 대상 상품                            |
| quantity          | integer       | NOT NULL                    | 수량 (max 15) — `01-overview.md §2`  |
| unitPriceSnapshot | integer       | NOT NULL                    | 추가 시점 가격 — `01-overview.md §2` |
| isSubstitutable   | boolean       | NOT NULL, default false     | 대체 가능 여부 — `01-overview.md §2` |
| createdAt         | timestamp(tz) | NOT NULL, defaultNow        | 생성 시각                            |
| updatedAt         | timestamp(tz) | NOT NULL, defaultNow        | 수정 시각                            |

Indexes: `uq_cart_items_cart_product` — UNIQUE(cart_id, product_id)

## Verification

```bash
pnpm nx run @fullstack-forge/api:typecheck
```

## Exit Criteria

- [ ] cartStatusEnum 정의 (active, converted, expired)
- [ ] carts 테이블 8개 컬럼 + partial unique index
- [ ] cartItems 테이블 8개 컬럼 + composite unique index
- [ ] relations.ts에 Cart↔CartItem, CartItem↔Product 관계 추가
- [ ] index.ts barrel export 추가
- [ ] typecheck 통과
