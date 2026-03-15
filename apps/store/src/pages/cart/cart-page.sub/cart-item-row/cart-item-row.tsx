import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@fullstack-forge/design-system/components/button'
import type { CartItem, CartResponse } from '~/@shared/api/cart'
import {
  cartQueryKeys,
  deleteCartItemMutationOptions,
  updateCartItemMutationOptions,
} from '~/@shared/queries/cart'
import { cartToast } from '~/@shared/ui/cart-toast'

const formatPrice = (price: number) => `${new Intl.NumberFormat('ko-KR').format(price)}원`

export function CartItemRow({ item }: Readonly<{ item: CartItem }>) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [optimisticQty, setOptimisticQty] = useState<number | null>(null)
  const isOutOfStock = item.stockDisplay === 'out_of_stock'

  const displayQty = optimisticQty ?? item.quantity

  const updateMutation = useMutation(updateCartItemMutationOptions())

  const deleteMutation = useMutation(deleteCartItemMutationOptions())

  const changeQuantity = async (newQty: number) => {
    if (newQty < 1 || newQty > 15) return
    setError(null)

    await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
    const previous = queryClient.getQueryData<CartResponse>(cartQueryKeys.cart)

    setOptimisticQty(newQty)

    if (previous) {
      queryClient.setQueryData<CartResponse>(cartQueryKeys.cart, {
        ...previous,
        totalAmount: previous.items.reduce(
          (sum, i) => sum + i.unitPriceSnapshot * (i.id === item.id ? newQty : i.quantity),
          0,
        ),
        items: previous.items.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i)),
      })
    }

    try {
      await updateMutation.mutateAsync({ cartItemId: item.id, quantity: newQty })
    } catch (err) {
      if (previous) {
        queryClient.setQueryData(cartQueryKeys.cart, previous)
      }
      setError(err instanceof Error ? err.message : '수량 변경에 실패했습니다')
    } finally {
      setOptimisticQty(null)
      void queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
    }
  }

  const removeItem = async () => {
    await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
    const previous = queryClient.getQueryData<CartResponse>(cartQueryKeys.cart)

    if (previous) {
      const filtered = previous.items.filter((i) => i.id !== item.id)
      queryClient.setQueryData<CartResponse>(cartQueryKeys.cart, {
        ...previous,
        itemCount: filtered.length,
        totalAmount: filtered.reduce((sum, i) => sum + i.unitPriceSnapshot * i.quantity, 0),
        items: filtered,
      })
    }

    try {
      await deleteMutation.mutateAsync(item.id)
    } catch {
      if (previous) {
        queryClient.setQueryData(cartQueryKeys.cart, previous)
      }
      cartToast.error({ title: '삭제에 실패했습니다' })
    } finally {
      void queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
    }
  }

  return (
    <div
      className={`flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-opacity ${isOutOfStock ? 'opacity-50' : ''} ${deleteMutation.isPending ? 'pointer-events-none opacity-40' : ''}`}
    >
      <img
        src={item.thumbUrl}
        alt={item.productName}
        className="h-12 w-12 shrink-0 rounded-md bg-slate-100 object-cover"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{item.productName}</p>
            <p className="text-xs text-slate-500">{item.sku}</p>
            <p className="text-xs text-slate-500">{formatPrice(item.unitPriceSnapshot)}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={removeItem}
            disabled={deleteMutation.isPending}
            aria-label={`${item.productName} 삭제`}
          >
            ✕
          </Button>
        </div>

        {isOutOfStock ? (
          <span className="mt-1 inline-block rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
            품절
          </span>
        ) : item.stockDisplay === 'low_stock' ? (
          <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            재고 부족
          </span>
        ) : null}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => changeQuantity(displayQty - 1)}
              disabled={deleteMutation.isPending || isOutOfStock || displayQty <= 1}
              aria-label="수량 감소"
            >
              −
            </Button>
            <span className="w-8 text-center text-sm font-medium tabular-nums">{displayQty}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => changeQuantity(displayQty + 1)}
              disabled={deleteMutation.isPending || isOutOfStock || displayQty >= 15}
              aria-label="수량 증가"
            >
              +
            </Button>
          </div>

          <p className="text-sm font-semibold text-slate-900">
            {formatPrice(item.unitPriceSnapshot * displayQty)}
          </p>
        </div>

        {error ? (
          <p className="mt-1 text-xs text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
