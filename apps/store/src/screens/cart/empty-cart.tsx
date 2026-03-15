import { Link } from '@tanstack/react-router'

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg font-medium text-slate-700">장바구니가 비어있습니다</p>
      <p className="mt-2 text-sm text-slate-500">상품을 추가해보세요.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        상품 둘러보기
      </Link>
    </div>
  )
}
