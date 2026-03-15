# Cart — DB Schema Session: Learnings

## 구현 요약

- `apps/api/src/db/schema/cart.ts` — `cartStatusEnum`, `carts` 테이블 (8컬럼 + partial unique index), `cartItems` 테이블 (8컬럼 + composite unique index)
- `apps/api/src/db/schema/relations.ts` — `cartsRelations`, `cartItemsRelations` 추가 + users/products relations에 cart 역참조 추가
- `apps/api/src/db/schema/index.ts` — barrel export 추가

## 배운 점

### 1. Partial Unique Index로 비즈니스 룰을 DB에서 보장한다

```typescript
uniqueIndex('uq_carts_user_active').on(table.userId).where(sql`status = 'active'`)
```

"사용자당 active 장바구니는 1개"라는 비즈니스 룰을 DB 레벨에서 강제한다. 애플리케이션 코드의 race condition과 무관하게 데이터 정합성을 보장하는 방어적 패턴.

Drizzle에서는 `where(sql\`...\`)` 로 partial index를 표현한다. PostgreSQL의 `CREATE UNIQUE INDEX ... WHERE condition` 에 대응.

### 2. Relations 추가 시 양방향 모두 수정해야 한다

cart relations를 추가하면서 `cartsRelations`, `cartItemsRelations`만 만들면 안 된다. 기존 `usersRelations`에 `carts: many(carts)`, `productsRelations`에 `cartItems: many(cartItems)` 역참조도 추가해야 한다.

Drizzle의 relations는 ORM의 eager loading(`db.query.carts.findFirst({ with: { items: true } })`)에 사용되므로, 양방향을 모두 정의해야 양쪽에서 쿼리할 수 있다.

### 3. FK onDelete 전략 선택

| FK | onDelete | 이유 |
|---|---|---|
| cartItems.cartId → carts.id | `cascade` | 장바구니 삭제 시 항목도 함께 삭제 |
| carts.userId → users.id | 없음 (default: no action) | 사용자 삭제 시 장바구니 데이터 보존 필요 (감사 목적) |
| cartItems.productId → products.id | 없음 (default: no action) | 상품 삭제 시 장바구니 항목 보존 (이미 스냅샷 저장) |

기존 코드베이스의 패턴: auth 관련은 `cascade` (세션, 자격증명), 비즈니스 데이터는 보존 지향.

### 4. Barrel Export는 알파벳 순서로 정리한다

`index.ts`의 기존 패턴을 보면:
- Tables는 도메인별 그룹으로 export
- Relations는 하나의 블록에 알파벳 순서로 나열

새로운 `cartItemsRelations`, `cartsRelations`를 추가할 때도 알파벳 순서에 맞춰 `categoriesRelations` 앞에 배치.

### 5. 가격은 정수(원 단위)로 저장한다

`unitPriceSnapshot`을 `integer` 타입으로 정의. 이 프로젝트의 통화 처리 컨벤션:
- DB: 원 단위 정수 (부동소수점 오차 방지)
- 프론트엔드: `Intl.NumberFormat('ko-KR')` 포맷팅
- 소수점 가격이 필요하면 "최소 단위 정수"(e.g., 센트) 패턴으로 확장 가능
