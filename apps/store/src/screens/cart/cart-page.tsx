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
            onClick={() => {
              void cartQuery.refetch()
            }}
          >
            다시 시도
          </Button>
        </div>
      ) : !cartQuery.data || cartQuery.data.items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">총 {cartQuery.data.itemCount}개</p>
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
            {[...cartQuery.data.items]
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
              .map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
          </div>

          <hr className="border-slate-200" />

          <CartSummary cart={cartQuery.data} />
        </div>
      )}
    </main>
  )
}

function CartSkeleton() {
  return (
    <div
      className="mt-6 space-y-3"
      role="status"
      aria-live="polite"
    >
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
