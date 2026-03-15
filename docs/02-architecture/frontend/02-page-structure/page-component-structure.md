---
title: "Page Component Structure"
description: "페이지 컴포넌트 자체가 테크스펙 역할을 하도록 전체 구조와 데이터 흐름을 명확히 드러내는 설계 원칙. Store 앱 실제 예시 포함."
type: guide
tags: [Architecture, React, BestPractice]
order: 1
---

# Page Component Structure — 예측 가능한 페이지 구조 설계

## 목적

페이지 컴포넌트만 보고도 해당 페이지의 **전체 구조와 동작을 한눈에 파악**할 수 있어야 합니다.

### 핵심 철학: 코드가 곧 테크스펙

**페이지 컴포넌트 자체가 테크스펙 역할을 해야 합니다.**

```tsx
// ✅ Store 앱 cart-page.tsx — 코드 자체가 테크스펙
export function CartPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-xl font-semibold">장바구니</h1>

      {/* 🔄 에러 경계 + 데이터 리셋이 한눈에 보임 */}
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary onReset={reset} fallback={...}>
            {/* 🔄 Suspense로 로딩 상태 선언적 처리 */}
            <Suspense fallback={<CartSkeleton />}>
              {/* 🔄 사용하는 API가 명확히 보임 */}
              <SuspenseQuery {...cartQueryOptions()}>
                {({ data: cart }) =>
                  cart.items.length === 0 ? (
                    <EmptyCart />           {/* 🔄 빈 상태 분기 */}
                  ) : (
                    <CartContentSection cart={cart} />  {/* 🔄 데이터 흐름 */}
                  )
                }
              </SuspenseQuery>
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </main>
  )
}
// 👆 이 코드만 보고도 에러 처리, 로딩, 데이터 흐름, 분기 조건을 모두 파악 가능
```

## 1. 해결하려는 문제

### 문제: 페이지 구조와 데이터 흐름을 예측할 수 없음

```tsx
// ❌ 페이지의 전체 구조와 데이터 연관성을 파악하기 어려움
const CartPage = () => {
  // 🔴 상단에 모든 로직이 선언됨 (사용처와 멀어짐)
  const { data: cartData, isLoading, error } = useQuery(cartQueryOptions())
  const [formData, setFormData] = useState({})
  const clearMutation = useMutation({ ... })

  const handleClear = useCallback(() => { ... }, [])

  // ... 50-100줄의 로딩/에러 분기 ...

  // 🔴 실제 사용은 훨씬 아래쪽에서
  return (
    <div>
      <Header />                    {/* 🔴 어떤 데이터를 사용하는지 추적 어려움 */}
      <Content data={cartData} />   {/* 🔴 cartData 선언부를 찾으려면 위로 스크롤 */}
      <Footer onClear={handleClear} /> {/* 🔴 handleClear 정의를 찾기 위해 위로 이동 */}
    </div>
  )
}
```

**문제점:**
- **선언부와 사용처 분리**: 상단에 모든 로직이 선언되어 실제 사용처와 멀어져 코드 흐름 파악 어려움
- **데이터 흐름 불분명**: 어떤 API를 사용하고 어떤 데이터가 어떤 컴포넌트에서 사용되는지 파악 불가
- **레이아웃 구조 예측 불가**: 페이지의 전체 레이아웃과 배치를 예측할 수 없음
- **상태 관리 투명성 부족**: 페이지의 핵심 상태와 비즈니스 로직이 숨겨져 있음

## 2. 해결 방법

### Store 앱 실제 패턴: cart-page.tsx

```tsx
// ✅ 페이지 구조와 데이터 흐름이 명확하게 드러나는 코드
export function CartPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-xl font-semibold text-slate-900">장바구니</h1>

      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallback={({ reset: resetBoundary }) => (
              <div className="mt-6 rounded bg-rose-100 p-4 text-sm text-rose-800">
                <p>장바구니를 불러오지 못했습니다.</p>
                <Button size="sm" variant="outline" onClick={resetBoundary}>
                  다시 시도
                </Button>
              </div>
            )}
          >
            <Suspense fallback={<CartSkeleton />}>
              <SuspenseQuery {...cartQueryOptions()}>
                {({ data: cart }) =>
                  cart.items.length === 0 ? (
                    <EmptyCart />
                  ) : (
                    <CartContentSection cart={cart} />
                  )
                }
              </SuspenseQuery>
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </main>
  )
}
```

### Store 앱 실제 패턴: product-detail-page.tsx

```tsx
// ✅ 로딩/에러/성공 상태가 명확히 보이는 구조
export function ProductDetailPage({ productId }: Readonly<{ productId: string }>) {
  const productQuery = useQuery(catalogDetailQueryOptions(productId))

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      {/* Breadcrumb — 네비게이션 구조 명확 */}
      <nav aria-label="breadcrumb">...</nav>

      {/* 로딩/에러/성공 상태가 선언적으로 분기 */}
      {productQuery.isPending ? (
        <ProductDetailSkeleton />
      ) : productQuery.isError || !productQuery.data ? (
        <div className="...">상품 정보를 불러오지 못했습니다.</div>
      ) : (
        <ProductDetailContent product={productQuery.data} productId={productId} />
      )}
    </main>
  )
}
```

### 달성되는 효과

- **빠른 이해**: 페이지 컴포넌트만 보고도 전체 동작을 파악 가능
- **개발 효율성**: 새로운 개발자도 빠르게 코드 이해 및 수정 가능
- **유지보수성**: 문제 발생 시 원인을 빠르게 찾고 해결 가능
- **문서화 불필요**: 코드 자체가 충분한 설명 역할 수행

## 3. 핵심 원칙

### 데이터 흐름 명시

```tsx
// ✅ SuspenseQuery — 사용하는 API와 데이터가 한눈에 보임
<SuspenseQuery {...cartQueryOptions()}>
  {({ data: cart }) => (
    <CartContentSection cart={cart} />
  )}
</SuspenseQuery>

// ✅ useQuery — 로딩/에러/성공 분기가 명확
const productQuery = useQuery(catalogDetailQueryOptions(productId))
```

### 에러 처리 명시

```tsx
// ✅ ErrorBoundary + QueryErrorResetBoundary — 에러 범위와 복구 전략이 명확
<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary onReset={reset} fallback={({ reset: resetBoundary }) => (
      <ErrorFallback onRetry={resetBoundary} />
    )}>
      <Suspense fallback={<LoadingSkeleton />}>
        {/* 데이터 페칭 */}
      </Suspense>
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

### Mutation과 사용자 액션 표현

```tsx
// ✅ Store 앱 패턴 — mutation과 에러 처리가 사용처 근처에
function CartContentSection({ cart }: Readonly<{ cart: CartResponse }>) {
  const queryClient = useQueryClient()
  const clearMutation = useMutation({
    ...clearCartMutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
    },
  })

  const onClearCart = () => {
    if (!window.confirm('장바구니를 비우시겠습니까?')) return
    clearMutation.mutate()
  }

  return (
    <div>
      <Button onClick={onClearCart} disabled={clearMutation.isPending}>
        {clearMutation.isPending ? '삭제 중…' : '전체 삭제'}
      </Button>
      {cart.items.map((item) => (
        <CartItemRow key={item.id} item={item} />
      ))}
      <CartSummary cart={cart} />
    </div>
  )
}
```

## 4. 주의사항 (Caveat)

### ❌ 남용하면 안 되는 경우: 복잡한 페이지에서 억지로 단일 구조로 만들려는 시도

```tsx
// ❌ 너무 많은 API를 하나의 SuspenseQuery로 처리
<SuspenseQueries
  queries={[
    userProfileOptions(userId),
    postsOptions(userId),
    ordersOptions(userId),
    productsOptions(),
    reviewsOptions(userId),
    favoritesOptions(userId),
    settingsOptions(userId),
    notificationsOptions(userId)
  ]}
>
  {/* 🔴 8개 API 동시 호출 → 가장 느린 API까지 전체 로딩 */}
</SuspenseQueries>
```

**✅ 해결책: 섹션별 분할 구조**

```tsx
// ✅ 각 섹션이 독립적으로 로드 → 점진적 렌더링
const DashboardPage = ({ userId }) => (
  <Layout.Container>
    <Layout.Header>
      <Suspense fallback={<HeaderSkeleton />}>
        <SuspenseQuery queryOptions={userProfileOptions(userId)}>
          {({ data }) => <UserInfo user={data} />}
        </SuspenseQuery>
      </Suspense>
    </Layout.Header>

    <Layout.MainContent>
      {/* 각 섹션이 독립적으로 로드 */}
      <OrdersSection userId={userId} />
      <PostsSection userId={userId} />
      <FavoritesSection userId={userId} />
    </Layout.MainContent>
  </Layout.Container>
)

// 각 섹션은 내부에서 필요한 데이터만 관리
const OrdersSection = ({ userId }) => (
  <ErrorBoundary fallback={<SectionErrorFallback />}>
    <Suspense fallback={<OrdersSkeleton />}>
      <SuspenseQuery queryOptions={ordersOptions(userId)}>
        {({ data }) => <OrdersList orders={data} />}
      </SuspenseQuery>
    </Suspense>
  </ErrorBoundary>
)
```

### ❌ 모든 상태를 페이지 레벨에서 관리하려는 경우

```tsx
// ❌ 모든 하위 컴포넌트의 상태를 페이지에서 관리
const CartPage = () => {
  const [itemQuantities, setItemQuantities] = useState({})
  const [selectedItems, setSelectedItems] = useState([])
  const [couponCode, setCouponCode] = useState('')
  // 🔴 하위 컴포넌트의 상태까지 페이지에서 관리 → Props Drilling
}
```

**✅ 해결책: 각 컴포넌트가 독립적으로 상태 관리**

```tsx
// ✅ Store 앱 패턴 — CartItemRow가 자체적으로 수량 상태 관리
export function CartItemRow({ item }: Readonly<{ item: CartItem }>) {
  const [optimisticQty, setOptimisticQty] = useState<number | null>(null)
  const updateMutation = useMutation(updateCartItemMutationOptions())
  const deleteMutation = useMutation(deleteCartItemMutationOptions())

  // 이 컴포넌트에서 필요한 상태와 mutation을 자체 관리
  const changeQuantity = async (newQty: number) => { ... }
  const removeItem = async () => { ... }

  return (/* 렌더링 */)
}
```

## 5. 사용된 레퍼런스

### Store 앱 실제 적용 사례

| 파일 | 패턴 | 줄 수 |
|------|------|-------|
| `cart-page.tsx` | ErrorBoundary + SuspenseQuery + 조건부 렌더링 | 127줄 |
| `product-detail-page.tsx` | useQuery 분기 + inline sub-components | 239줄 |
| `login-page.tsx` | useForm + useMutation + 에러 표시 | 154줄 |
| `home-page.tsx` | 검색/필터/페이지네이션 + inline StockBadge | 458줄 |

## 6. 더 알아보기

### 권장 사용 시나리오

**적합한 경우:**
- 복잡한 데이터 처리가 필요한 대시보드 페이지
- 여러 API 호출과 상태 관리가 필요한 폼 페이지
- 팀에서 코드 가독성과 유지보수성을 중시하는 경우

**부적합한 경우:**
- 매우 단순한 정적 페이지 (과도한 구조화 불필요)
- 프로토타입이나 일회성 페이지

### 관련 문서

- [Source Folder Structure](./src-folder-structure.md): 폴더 구조 설계와 파일/폴더 결정 규칙
- [API Patterns](../02-api-patterns.md): 데이터 페칭과 상태 관리 패턴
- [Suspensive Boundaries](../03-suspensive-boundaries.adr.md): Suspense/ErrorBoundary 도입 근거
- [Call-site Readability](../04-callsite-readability.md): mutateAsync 흐름, 핸들러 네이밍
