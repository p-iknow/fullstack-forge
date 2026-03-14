# Cart — Store UI Session

## Context

- **현재 상태**: API spec + DB + Backend 완료 (01-03 세션). Store UI 없음.
- **패턴 레퍼런스**:
  - API client: `apps/store/src/lib/api/catalog.ts`
  - Query options: `apps/store/src/lib/queries/catalog.ts`
  - Route file: `apps/store/src/routes/_catalog/index.tsx`
  - Screen: `apps/store/src/screens/home/home-page.tsx`
- **PRD 근거**: `docs/01-prd/04-cart/04-ui.md`

## Scope

**이 세션에서 하는 것**:
- Cart API client (fetch functions)
- Cart query/mutation options
- Cart page route + screen
- 상품 상세에 "장바구니 추가" 버튼
- Navigation 장바구니 아이콘 + 배지

**이 세션에서 하지 않는 것**:
- 주문 전환 UI (06-order-payment에서)
- 가격 변경 고지 모달 (06-order-payment에서)
- Admin UI (cart는 admin 화면 없음)

**생성할 파일**:
- `apps/store/src/lib/api/cart.ts`
- `apps/store/src/lib/queries/cart.ts`
- `apps/store/src/routes/_catalog/cart.tsx`
- `apps/store/src/screens/cart/cart-page.tsx`
- `apps/store/src/screens/cart/cart-item-row.tsx`
- `apps/store/src/screens/cart/cart-summary.tsx`
- `apps/store/src/screens/cart/empty-cart.tsx`

**수정할 파일**:
- `apps/store/src/screens/catalog/product-detail-page.tsx` (장바구니 추가 버튼)
- `apps/store/src/routes/__root.tsx` (장바구니 링크 + 배지)

## Progressive Tasks

### 1. Cart API client

파일: `apps/store/src/lib/api/cart.ts`

```typescript
// Types: CartResponse, CartItem, CartItemStockDisplay
// Functions:
//   getCart(): Promise<CartResponse>
//   addCartItem(productId, quantity): Promise<CartResponse>
//   updateCartItem(cartItemId, quantity): Promise<CartResponse>
//   deleteCartItem(cartItemId): Promise<CartResponse>
//   clearCart(): Promise<void>
```

### 2. Cart query/mutation options

파일: `apps/store/src/lib/queries/cart.ts`

```typescript
export const cartQueryKeys = { cart: ['cart'] as const }

export const cartQueryOptions = () => queryOptions({
  queryKey: cartQueryKeys.cart,
  queryFn: getCart,
  staleTime: 10_000,  // 재고 실시간성
})
// Mutations: addItem, updateItem, deleteItem, clearCart
// onSuccess → invalidateQueries(['cart'])
```

### 3. Cart route

파일: `apps/store/src/routes/_catalog/cart.tsx` → CartPage import

### 4. CartPage screen

파일: `apps/store/src/screens/cart/cart-page.tsx`

### 5. CartItemRow component

파일: `apps/store/src/screens/cart/cart-item-row.tsx`

- 수량 +/- 버튼 + 직접 입력 — `04-ui.md §3`
- 품절: opacity-50 + "품절" Badge + 수량 비활성 — `04-ui.md §5`
- 저재고: "재고 부족" Badge — `04-ui.md §5`
- mutation 중 인라인 스피너 — `04-ui.md §7`

### 6. CartSummary component

파일: `apps/store/src/screens/cart/cart-summary.tsx`

- 총 상품금액, 만료 예정 시간
- 품절 항목 있으면 주문 버튼 비활성 + 안내 — `04-ui.md §5`

### 7. EmptyCart component

파일: `apps/store/src/screens/cart/empty-cart.tsx` — "장바구니가 비어있습니다" + 쇼핑하기 링크

### 8. 상품 상세 장바구니 추가

파일: `apps/store/src/screens/catalog/product-detail-page.tsx` 수정
- "장바구니 담기" Button + 수량 선택 (기본 1, 최대 15)
- 성공 → toast "장바구니에 담았습니다"

### 9. Navigation 장바구니 아이콘

파일: `apps/store/src/routes/__root.tsx` 수정 — 헤더에 장바구니 아이콘 + itemCount 배지

## Data Contract

### Component Tree

```
CartPage
├── Loading → Skeleton (CartItemRow x3 + CartSummary)
├── Error → 에러 메시지 + 재시도
├── Empty → EmptyCart ("장바구니가 비어있습니다" + 쇼핑하기)
└── Content
    ├── CartHeader (총 N개 | 전체 삭제)
    ├── CartItemRow[] (repeat)
    │   ├── ProductInfo (썸네일, 상품명, SKU)
    │   ├── StockBadge (out_of_stock→품절, low_stock→재고부족)
    │   ├── QuantityControl (-, 수량, +)
    │   ├── PriceDisplay (unitPrice × quantity)
    │   └── DeleteButton
    ├── Separator
    └── CartSummary
        ├── TotalAmount
        ├── ExpiryNotice (만료 예정 시각)
        └── CheckoutButton (품절 시 비활성)
```

### 에러 처리 — `04-ui.md §7`

| 에러 | UI |
|------|------|
| API 실패 | toast + 재시도 |
| 수량 위반 (400) | 인라인 "최대 15개까지" |
| 동시성 충돌 (409) | 자동 새로고침 |
| cart_not_active (409) | toast "장바구니를 사용할 수 없습니다" |

### 상태별 UI — `04-ui.md §6`

| 상태 | 처리 |
|------|------|
| active | CRUD + 주문 허용 |
| converted | 변경 불가, 주문 내역 이동 유도 |
| expired | 항목 비활성, 새 장바구니 유도 |

## Verification

```bash
pnpm nx run @fullstack-forge/store:typecheck
pnpm nx run @fullstack-forge/store:build
```

## Exit Criteria

- [ ] /cart 라우트 렌더링
- [ ] 빈 장바구니 안내 + 상품 둘러보기 링크
- [ ] 항목: 이미지, 상품명, 수량, 가격 표시
- [ ] 수량 증가/감소/직접입력 동작
- [ ] 최대 수량(15) 초과 시 인라인 에러
- [ ] 단일 항목 삭제 동작
- [ ] 전체 비우기 → 확인 다이얼로그 → 삭제 — `04-ui.md §8`
- [ ] 품절 항목: 흐림 + "품절" 배지 + 수량 비활성
- [ ] 저재고 항목: "재고 부족" 배지
- [ ] 품절 포함 시 주문 버튼 비활성 + 안내
- [ ] 만료 예정 시간 표시
- [ ] 상품 상세 "장바구니 담기" 동작
- [ ] 헤더 장바구니 아이콘 + 배지
- [ ] typecheck/build 통과
