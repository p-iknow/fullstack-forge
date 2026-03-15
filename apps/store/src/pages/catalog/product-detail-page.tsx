import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ChevronRightIcon,
  Loader2Icon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
} from 'lucide-react'
import { Button } from '@fullstack-forge/design-system/components/button'
import { Skeleton } from '@fullstack-forge/design-system/components/skeleton'
import { catalogDetailQueryOptions } from '~/@shared/queries/catalog'
import { addCartItemMutationOptions, cartQueryKeys } from '~/@shared/queries/cart'
import { cartToast } from '~/@shared/ui/cart-toast'

const formatPrice = (price: number) => `${new Intl.NumberFormat('ko-KR').format(price)}원`

export function ProductDetailPage({ productId }: Readonly<{ productId: string }>) {
  const productQuery = useQuery(catalogDetailQueryOptions(productId))

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-foreground">
          홈
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-foreground">상품 상세</span>
      </nav>

      {productQuery.isPending ? (
        <ProductDetailSkeleton />
      ) : productQuery.isError || !productQuery.data ? (
        <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          상품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      ) : (
        <ProductDetailContent product={productQuery.data} productId={productId} />
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

function ProductDetailContent({
  product,
  productId,
}: Readonly<{ product: ProductData; productId: string }>) {
  const stockLabel = !product.isActive
    ? '비활성'
    : product.stockDisplay === 'out_of_stock'
      ? '품절'
      : product.stockDisplay === 'low_stock'
        ? '재고임박'
        : '판매중'

  const stockColor = !product.isActive || product.stockDisplay === 'out_of_stock'
    ? 'text-destructive'
    : product.stockDisplay === 'low_stock'
      ? 'text-amber-600'
      : 'text-primary'

  return (
    <section className="mt-6 grid gap-6 md:mt-8 md:grid-cols-2 md:gap-10">
      {/* Image */}
      <div className="overflow-hidden rounded-xl border border-border bg-muted md:rounded-2xl">
        <img
          src={product.detailUrl}
          alt={`${product.name} 이미지`}
          loading="lazy"
          className="aspect-[4/3] w-full object-contain md:aspect-square md:object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground md:text-sm">{product.categoryName}</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground md:text-3xl">
          {product.name}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">{product.brand}</p>

        <p className="mt-4 text-2xl font-bold tracking-tight text-foreground md:mt-6 md:text-3xl">
          {formatPrice(product.price)}
        </p>

        {/* Attributes */}
        <dl className="mt-6 border-t border-border pt-6">
          <div className="flex items-baseline justify-between py-2 text-sm">
            <dt className="text-muted-foreground">상태</dt>
            <dd className={`font-semibold ${stockColor}`}>
              {stockLabel}
            </dd>
          </div>
          <div className="flex items-baseline justify-between py-2 text-sm">
            <dt className="text-muted-foreground">가용 재고</dt>
            <dd className="font-medium text-foreground">{product.availableStock}개</dd>
          </div>
          <div className="flex items-baseline justify-between py-2 text-sm">
            <dt className="text-muted-foreground">중량</dt>
            <dd className="font-medium text-foreground">{product.weight}g</dd>
          </div>
        </dl>

        {/* Description */}
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        {/* Purchase */}
        <div className="mt-auto pt-8">
          {!product.canPurchase ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {!product.isActive
                ? '단종 상품으로 신규 구매가 불가합니다.'
                : '품절 상태로 구매가 불가합니다.'}
            </div>
          ) : (
            <AddToCartControl productId={productId} />
          )}
        </div>
      </div>
    </section>
  )
}

function AddToCartControl({ productId }: Readonly<{ productId: string }>) {
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)

  const addMutation = useMutation({
    ...addCartItemMutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
      cartToast.success({
        title: '장바구니에 담았습니다',
        description: `${quantity}개 추가됨`,
        actionLabel: '장바구니 보기',
        actionHref: '/cart',
      })
      setQuantity(1)
    },
    onError: (err: Error) => {
      cartToast.error({ title: '장바구니 담기 실패', description: err.message })
    },
  })

  const onAdd = () => {
    addMutation.mutate({ productId, quantity })
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm md:static md:inset-auto md:z-auto md:border-t-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Quantity stepper */}
        <div className="inline-flex shrink-0 items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <MinusIcon className="h-4 w-4" />
            <span className="sr-only">수량 감소</span>
          </button>
          <span className="flex h-10 w-14 items-center justify-center border-x border-border text-sm font-semibold tabular-nums text-foreground">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(15, q + 1))}
            disabled={quantity >= 15}
            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="sr-only">수량 증가</span>
          </button>
        </div>

        {/* Add to cart button */}
        <Button
          type="button"
          onClick={onAdd}
          disabled={addMutation.isPending}
          className="relative h-12 flex-1 gap-2 text-sm font-semibold md:w-52 md:flex-none"
        >
          <ShoppingCartIcon className="h-5 w-5" />
          장바구니 담기
          <Loader2Icon
            className={`absolute right-4 h-4 w-4 transition-opacity duration-200 ${addMutation.isPending ? 'animate-spin opacity-60' : 'opacity-0'}`}
            aria-hidden={!addMutation.isPending}
          />
        </Button>
      </div>
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <section
      data-testid="product-detail-skeleton"
      role="status"
      aria-live="polite"
      className="mt-6 grid gap-6 md:mt-8 md:grid-cols-2 md:gap-10"
    >
      <p className="sr-only">상품 상세를 불러오는 중...</p>
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-4 h-10 w-1/3" />
        <div className="mt-6 space-y-3 border-t border-border pt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="mt-4 h-20 w-full" />
        <Skeleton className="mt-6 h-12 w-full rounded-lg" />
      </div>
    </section>
  )
}
