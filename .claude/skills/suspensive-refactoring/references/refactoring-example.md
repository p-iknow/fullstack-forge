# Suspensive Refactoring — Cart Page 실전 예시

## Before: 수동 상태 분기

`useQuery` 결과를 `isPending`/`isError`/데이터 유무로 삼항 분기하는 전형적 패턴.

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@fullstack-forge/design-system/components/skeleton'
import { Button } from '@fullstack-forge/design-system/components/button'
import { cartQueryKeys, cartQueryOptions, clearCartMutationOptions } from '~/lib/queries/cart'
import { CartItemRow } from './cart-item-row'
import { CartSummary } from './cart-summary'
import { EmptyCart } from './empty-cart'

export function CartPage() {
  const queryClient = useQueryClient()
  const cartQuery = useQuery(cartQueryOptions())

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
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-xl font-semibold text-slate-900">장바구니</h1>

      {cartQuery.isPending ? (
        <CartSkeleton />
      ) : cartQuery.isError ? (
        <div className="mt-6 rounded bg-rose-100 p-4 text-sm text-rose-800">
          <p>장바구니를 불러오지 못했습니다.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => { void cartQuery.refetch() }}
          >
            다시 시도
          </Button>
        </div>
      ) : !cartQuery.data || cartQuery.data.items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="mt-6 space-y-6">
          {/* mutation + data 렌더링이 한 컴포넌트에 혼재 */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">총 {cartQuery.data.itemCount}개</p>
            <Button onClick={onClearCart} disabled={clearMutation.isPending}>
              {clearMutation.isPending ? '삭제 중…' : '전체 삭제'}
            </Button>
          </div>
          {[...cartQuery.data.items]
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((item) => <CartItemRow key={item.id} item={item} />)}
          <CartSummary cart={cartQuery.data} />
        </div>
      )}
    </main>
  )
}
```

### 문제점

1. **4중 삼항 연산자** — pending → error → empty → data 분기가 한 JSX 블록에 중첩
2. **query + mutation 혼재** — 데이터 fetching 상태 관리와 mutation 로직이 한 컴포넌트에 결합
3. **수동 refetch** — 에러 시 `cartQuery.refetch()` 직접 호출, query 에러 상태 리셋 누락 가능
4. **테스트 어려움** — 상태별 렌더링 테스트가 query mock에 전적으로 의존

---

## After: Suspensive 선언적 경계

```tsx
import { useMutation, QueryErrorResetBoundary, useQueryClient } from '@tanstack/react-query'
import { ErrorBoundary, Suspense } from '@suspensive/react'
import { SuspenseQuery } from '@suspensive/react-query'
import { Skeleton } from '@fullstack-forge/design-system/components/skeleton'
import { Button } from '@fullstack-forge/design-system/components/button'
import type { CartResponse } from '~/lib/api/cart'
import { cartQueryKeys, cartQueryOptions, clearCartMutationOptions } from '~/lib/queries/cart'
import { CartItemRow } from './cart-item-row'
import { CartSummary } from './cart-summary'
import { EmptyCart } from './empty-cart'

export function CartPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-xl font-semibold text-slate-900">장바구니</h1>

      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallback={({ error, reset: resetBoundary }) => (
              <div className="mt-6 rounded bg-rose-100 p-4 text-sm text-rose-800">
                <p>장바구니를 불러오지 못했습니다.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={resetBoundary}
                >
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
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">총 {cart.itemCount}개</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onClearCart}
          disabled={clearMutation.isPending}
        >
          {clearMutation.isPending ? '삭제 중…' : '전체 삭제'}
        </Button>
      </div>

      <div className="space-y-3">
        {[...cart.items]
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
      </div>

      <hr className="border-slate-200" />

      <CartSummary cart={cart} />
    </div>
  )
}
```

### 개선점

1. **삼항 연산자 제거** — loading/error/data 분기가 선언적 경계로 분리됨
2. **관심사 분리** — 페이지 셸(`CartPage`)과 데이터 컨텐츠(`CartContentSection`) 분리
3. **자동 에러 리셋** — `QueryErrorResetBoundary` + `onReset`으로 쿼리 에러 상태 자동 초기화
4. **테스트 용이** — Suspense fallback은 느린 응답, ErrorBoundary fallback은 에러 응답으로 자연스럽게 검증

---

## 변환 체크리스트

| #   | 항목                                              | 확인 |
| --- | ------------------------------------------------- | ---- |
| 1   | `useQuery` → `SuspenseQuery` render prop으로 교체 |      |
| 2   | `isPending` 분기 → `<Suspense fallback={}>` 교체  |      |
| 3   | `isError` 분기 → `<ErrorBoundary fallback={}>` 교체 |      |
| 4   | `QueryErrorResetBoundary`로 ErrorBoundary 래핑    |      |
| 5   | 정적 UI(제목 등)는 경계 바깥에 배치               |      |
| 6   | Mutation 로직은 별도 컴포넌트로 추출               |      |
| 7   | `Readonly<>` 타입 래퍼 적용                        |      |
| 8   | LSP 진단 클린 확인                                 |      |
| 9   | 기존 테스트 통과 확인                              |      |

---

## Skeleton 컴포넌트 (변경 없음)

Skeleton 컴포넌트는 `<Suspense fallback={}>` 으로 그대로 전달. `role="status"`, `aria-live="polite"`, `sr-only` 텍스트 유지.

```tsx
function CartSkeleton() {
  return (
    <div className="mt-6 space-y-3" role="status" aria-live="polite">
      <p className="sr-only">장바구니를 불러오는 중...</p>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-md bg-slate-200!" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 bg-slate-200!" />
            <Skeleton className="h-3 w-1/3 bg-slate-200!" />
            <Skeleton className="h-8 w-full bg-slate-200!" />
          </div>
        </div>
      ))}
      <Skeleton className="h-32 w-full rounded-lg bg-slate-200!" />
    </div>
  )
}
```
