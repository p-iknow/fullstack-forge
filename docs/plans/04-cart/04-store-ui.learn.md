# Cart — Store UI Session: Learnings

## 구현 요약

- `apps/store/src/@shared/api/cart.ts` — 5개 API 함수 (getCart, addCartItem, updateCartItem, deleteCartItem, clearCart)
- `apps/store/src/@shared/queries/cart.ts` — queryOptions + 4개 mutationOptions
- `apps/store/src/routes/_catalog/cart.tsx` — /cart 라우트
- `apps/store/src/pages/cart/cart-page.tsx` — 메인 장바구니 페이지
- `apps/store/src/pages/cart/cart-item-row.tsx` — 장바구니 아이템 행 (수량 조절, 삭제, 재고 배지)
- `apps/store/src/pages/cart/cart-summary.tsx` — 합계 + 만료시간 + 주문 버튼
- `apps/store/src/pages/cart/empty-cart.tsx` — 빈 장바구니 안내
- `apps/store/src/pages/catalog/product-detail-page.tsx` — "장바구니 담기" 버튼 추가
- `apps/store/src/pages/catalog/store-top-nav.tsx` — 장바구니 아이콘 + 배지 추가

## 배운 점

### 1. 수동 API Client vs Generated Client

이 프로젝트에는 두 가지 API client 패턴이 공존한다:

| 패턴 | 사용처 | 장점 |
|---|---|---|
| Generated (hey-api) | auth, admin | 자동 타입 생성, SDK 메서드 |
| Manual (fetchWithRefresh) | catalog, cart | 단순, 타입 수동 정의 |

Cart는 manual 패턴을 따랐다. `fetchWithRefresh`가 401 자동 재시도(token refresh)를 처리하므로 인증 흐름이 투명하게 동작한다. Generated client를 쓰려면 codegen 설정에 cart 도메인을 추가해야 하는데, 수동 패턴이 이 프로젝트에서는 충분히 효과적이다.

### 2. Query vs Mutation 사용 분기

```typescript
// Query — 조회(자동 refetch, caching, stale 관리)
const cartQuery = useQuery(cartQueryOptions())

// Mutation — 변경(수동 트리거, onSuccess에서 invalidate)
const addMutation = useMutation({
  ...addCartItemMutationOptions(),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
  },
})
```

Mutation 성공 시 `invalidateQueries`로 cart query를 무효화해 최신 데이터를 자동 refetch. 이 패턴은 optimistic update보다 단순하고, 서버의 stockDisplay 계산 결과를 항상 신뢰하므로 정합성이 높다.

### 3. staleTime 전략

| 도메인 | staleTime | 이유 |
|---|---|---|
| Catalog | 30-60초 | 상품 정보는 자주 안 변함 |
| Cart | 10초 | 재고 실시간성이 중요 (다른 사용자의 구매로 재고 변동) |
| Auth (me) | 30초 | 세션 상태는 안정적 |

Cart의 짧은 staleTime은 재고 기반 stockDisplay가 빠르게 갱신되어야 하기 때문.

### 4. 장바구니 배지 — 조건부 Query Enable

```typescript
const cartQuery = useQuery({
  ...cartQueryOptions(),
  enabled: isHydrated && !!currentUser,
})
```

비로그인 사용자에게는 cart query를 실행하지 않는다 (`enabled: false`). 이렇게 하면:
- 불필요한 401 에러 방지
- 네트워크 요청 절약
- 로그인 후 자동으로 enable → fetch 시작

### 5. React 컴포넌트 내 mutation 에러 처리 패턴

```typescript
const [error, setError] = useState<string | null>(null)

const updateMutation = useMutation({
  ...updateCartItemMutationOptions(),
  onSuccess: () => { setError(null) },
  onError: (err: Error) => { setError(err.message) },
})
```

에러를 컴포넌트 local state로 관리. TanStack Query의 `mutation.error`도 사용 가능하지만, local state 방식이 에러 표시/해제 타이밍을 세밀하게 제어할 수 있다. 특히 수량 변경 같은 인라인 에러에서 유용.

### 6. SVG 아이콘 인라인 사용

장바구니 아이콘을 별도 아이콘 라이브러리 없이 Heroicons SVG를 인라인으로 삽입했다. 이 프로젝트에 아이콘 패키지가 없으므로, 단일 아이콘 추가를 위해 의존성을 추가하지 않는 것이 적절하다.

```tsx
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c..." />
</svg>
```

아이콘이 많아지면 `@heroicons/react` 또는 `lucide-react` 도입을 검토할 시점.
