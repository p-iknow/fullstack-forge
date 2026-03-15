import type { CartResponse } from '~/@shared/api/cart'

const formatPrice = (price: number) => `${new Intl.NumberFormat('ko-KR').format(price)}원`

const formatExpiry = (expiresAt: string) => {
  const date = new Date(expiresAt)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CartSummary({ cart }: Readonly<{ cart: CartResponse }>) {
  const hasOutOfStock = cart.items.some((item) => item.stockDisplay === 'out_of_stock')

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">총 상품금액</span>
        <span className="text-lg font-bold text-slate-900">{formatPrice(cart.totalAmount)}</span>
      </div>

      <p className="mt-2 text-xs text-slate-500">만료 예정: {formatExpiry(cart.expiresAt)}</p>

      <div className="mt-4">
        <button
          type="button"
          disabled={hasOutOfStock}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          주문하기
        </button>
        {hasOutOfStock ? (
          <p className="mt-2 text-center text-xs text-rose-600">품절 상품을 제거해주세요.</p>
        ) : null}
      </div>
    </div>
  )
}
