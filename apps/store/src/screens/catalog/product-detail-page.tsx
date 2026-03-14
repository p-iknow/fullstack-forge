import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Skeleton } from '@fullstack-forge/design-system/components/skeleton'
import { catalogDetailQueryOptions } from '~/lib/queries/catalog'

const formatPrice = (price: number) => `${new Intl.NumberFormat('ko-KR').format(price)}원`

export function ProductDetailPage({ productId }: Readonly<{ productId: string }>) {
  const productQuery = useQuery(catalogDetailQueryOptions(productId))

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link to="/" className="text-sm text-slate-600 underline">
        상품 목록으로 돌아가기
      </Link>

      {productQuery.isPending ? (
        <ProductDetailSkeleton />
      ) : productQuery.isError || !productQuery.data ? (
        <p className="mt-4 rounded bg-rose-100 p-3 text-sm text-rose-800">
          상품 정보를 불러오지 못했습니다.
        </p>
      ) : (
        <ProductDetailContent product={productQuery.data} />
      )}
    </main>
  )
}

type ProductData = {
  detailUrl: string
  name: string
  categoryName: string
  brand: string
  price: number
  weight: number
  isActive: boolean
  stockDisplay: 'in_stock' | 'low_stock' | 'out_of_stock'
  availableStock: number
  description: string
  canPurchase: boolean
}

function ProductDetailContent({ product }: Readonly<{ product: ProductData }>) {
  return (
    <section className="mt-4 grid gap-6 rounded-xl border border-slate-200 bg-white p-6 md:grid-cols-2">
      <div>
        <img
          src={product.detailUrl}
          alt={`${product.name} 이미지`}
          loading="lazy"
          className="aspect-square w-full rounded-lg bg-slate-100 object-cover"
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs text-slate-500">{product.categoryName}</p>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="text-sm text-slate-600">브랜드: {product.brand}</p>
        <p className="text-lg font-semibold">{formatPrice(product.price)}</p>
        <p className="text-sm text-slate-600">중량: {product.weight}g</p>
        <p className="text-sm text-slate-600">
          상태:{' '}
          {!product.isActive
            ? '비활성'
            : product.stockDisplay === 'out_of_stock'
              ? '품절'
              : product.stockDisplay === 'low_stock'
                ? '재고임박'
                : '판매중'}
        </p>
        <p className="text-sm text-slate-600">가용 재고: {product.availableStock}개</p>
        <p className="text-sm text-slate-700">{product.description}</p>

        {!product.canPurchase ? (
          <p className="rounded bg-rose-100 p-3 text-sm text-rose-700">
            {!product.isActive
              ? '단종 상품으로 신규 구매가 불가합니다.'
              : '품절 상태로 구매가 불가합니다.'}
          </p>
        ) : (
          <p className="rounded bg-emerald-100 p-3 text-sm text-emerald-700">
            구매 가능한 상품입니다.
          </p>
        )}
      </div>
    </section>
  )
}

function ProductDetailSkeleton() {
  return (
    <section
      data-testid="product-detail-skeleton"
      role="status"
      aria-live="polite"
      className="mt-4 grid gap-6 rounded-xl border border-slate-200 bg-white p-6 md:grid-cols-2"
    >
      <p className="sr-only">상품 상세를 불러오는 중...</p>
      <div>
        <Skeleton className="aspect-square w-full rounded-lg bg-slate-200!" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-3 w-16 bg-slate-300!" />
        <Skeleton className="h-7 w-3/4 bg-slate-300!" />
        <Skeleton className="h-4 w-1/3 bg-slate-300!" />
        <Skeleton className="h-5 w-1/4 bg-slate-300!" />
        <Skeleton className="h-4 w-24 bg-slate-300!" />
        <Skeleton className="h-4 w-20 bg-slate-300!" />
        <Skeleton className="h-4 w-28 bg-slate-300!" />
        <Skeleton className="h-16 w-full bg-slate-300!" />
        <Skeleton className="h-10 w-full rounded bg-slate-200!" />
      </div>
    </section>
  )
}
