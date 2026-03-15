import { useEffect, useMemo, useRef, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Button } from '@fullstack-forge/design-system/components/button'
import { Input } from '@fullstack-forge/design-system/components/input'
import { Skeleton } from '@fullstack-forge/design-system/components/skeleton'
import { Link } from '@tanstack/react-router'
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon, SearchIcon } from 'lucide-react'
import {
  catalogCategoriesQueryOptions,
  catalogListQueryOptions,
  catalogSearchQueryOptions,
} from '~/lib/queries/catalog'

type CatalogStockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'

const stockDisplayOptions: Array<{ value: CatalogStockFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'low_stock', label: '재고임박' },
  { value: 'out_of_stock', label: '품절' },
]

const formatPrice = (price: number) => `${new Intl.NumberFormat('ko-KR').format(price)}원`
const pageSize = 20
const maxPageButtons = 5
const placeholderCardCount = pageSize
const LOADER_DELAY_MS = 0
const MIN_LOADER_VISIBLE_MS = 500

export function HomePage() {
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [stockDisplay, setStockDisplay] = useState<CatalogStockFilter>('all')
  const [brand, setBrand] = useState('')
  const [page, setPage] = useState(1)
  const [showProductsLoader, setShowProductsLoader] = useState(false)
  const loaderShownAtRef = useRef<number | null>(null)
  const showLoaderTimerRef = useRef<number | null>(null)
  const hideLoaderTimerRef = useRef<number | null>(null)

  const categoriesQuery = useQuery(catalogCategoriesQueryOptions())

  const listParams = useMemo(
    () => ({
      category: category || undefined,
      stockDisplay: stockDisplay === 'all' ? undefined : stockDisplay,
      brand: brand || undefined,
      page,
      pageSize,
      sort: 'latest' as const,
      order: 'desc' as const,
    }),
    [brand, category, page, stockDisplay],
  )

  useEffect(() => {
    setPage(1)
  }, [category, stockDisplay, brand, submittedKeyword])

  const listQuery = useQuery({
    ...catalogListQueryOptions(listParams),
    enabled: !submittedKeyword,
    placeholderData: keepPreviousData,
  })

  const searchQuery = useQuery({
    ...catalogSearchQueryOptions({
      ...listParams,
      q: submittedKeyword,
    }),
    enabled: Boolean(submittedKeyword),
    placeholderData: keepPreviousData,
  })

  const productsQuery = submittedKeyword ? searchQuery : listQuery
  const isProductsLoading = productsQuery.isPending || productsQuery.isFetching
  const showProductsSkeleton = isProductsLoading || showProductsLoader
  const totalItems = productsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const visibleItems = useMemo(() => {
    const items = productsQuery.data?.items ?? []
    return items.toSorted((a, b) => {
      const aUnavailable = !a.isActive || a.stockDisplay === 'out_of_stock' ? 1 : 0
      const bUnavailable = !b.isActive || b.stockDisplay === 'out_of_stock' ? 1 : 0
      return aUnavailable - bUnavailable
    })
  }, [productsQuery.data?.items])
  const hasActiveFilters = Boolean(submittedKeyword || category || brand || stockDisplay !== 'all')
  const showEmptyFallback =
    !showProductsSkeleton && !productsQuery.isError && visibleItems.length === 0
  const pageNumbers = useMemo(() => {
    const windowSize = Math.min(maxPageButtons, totalPages)
    const half = Math.floor(windowSize / 2)
    const start = Math.max(1, Math.min(page - half, totalPages - windowSize + 1))
    return Array.from({ length: windowSize }, (_, index) => start + index)
  }, [page, totalPages])

  useEffect(() => {
    if (productsQuery.data && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, productsQuery.data, totalPages])

  useEffect(() => {
    const clearShowLoaderTimer = () => {
      if (showLoaderTimerRef.current !== null) {
        window.clearTimeout(showLoaderTimerRef.current)
        showLoaderTimerRef.current = null
      }
    }

    const clearHideLoaderTimer = () => {
      if (hideLoaderTimerRef.current !== null) {
        window.clearTimeout(hideLoaderTimerRef.current)
        hideLoaderTimerRef.current = null
      }
    }

    if (isProductsLoading) {
      clearHideLoaderTimer()
      if (!showProductsLoader && showLoaderTimerRef.current === null) {
        showLoaderTimerRef.current = window.setTimeout(() => {
          setShowProductsLoader(true)
          loaderShownAtRef.current = Date.now()
          showLoaderTimerRef.current = null
        }, LOADER_DELAY_MS)
      }
      return () => {
        clearShowLoaderTimer()
      }
    }

    clearShowLoaderTimer()
    if (!showProductsLoader) {
      loaderShownAtRef.current = null
      return
    }

    const shownAt = loaderShownAtRef.current ?? Date.now()
    const elapsed = Date.now() - shownAt
    const remaining = Math.max(0, MIN_LOADER_VISIBLE_MS - elapsed)

    hideLoaderTimerRef.current = window.setTimeout(() => {
      setShowProductsLoader(false)
      loaderShownAtRef.current = null
      hideLoaderTimerRef.current = null
    }, remaining)

    return () => {
      clearHideLoaderTimer()
    }
  }, [isProductsLoading, showProductsLoader])

  useEffect(() => {
    return () => {
      if (showLoaderTimerRef.current !== null) {
        window.clearTimeout(showLoaderTimerRef.current)
      }
      if (hideLoaderTimerRef.current !== null) {
        window.clearTimeout(hideLoaderTimerRef.current)
      }
    }
  }, [])

  const clearAllFilters = () => {
    setKeyword('')
    setSubmittedKeyword('')
    setCategory('')
    setStockDisplay('all')
    setBrand('')
    setPage(1)
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-4xl">
            상품 카탈로그
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            신선한 식료품부터 생활용품까지, 원하는 상품을 탐색하세요.
          </p>

          {/* Search bar inside hero */}
          <form
            className="mt-5 flex max-w-xl gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              setSubmittedKeyword(keyword.trim())
            }}
          >
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="상품명, 브랜드, SKU로 검색"
                className="pl-9"
              />
            </div>
            <Button type="submit">검색</Button>
          </form>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 overflow-x-hidden px-4 py-6 md:px-6 md:py-8">
        {/* Category tabs — underline style */}
        <div className="-mx-4 overflow-x-auto px-4 scrollbar-none md:mx-0 md:overflow-visible md:px-0">
          <div className="flex items-center gap-1 border-b border-border">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`relative shrink-0 px-3 pb-2.5 pt-1 text-sm transition-colors ${
                !category
                  ? 'font-semibold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              전체
            </button>
            {categoriesQuery.data?.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id === category ? '' : item.id)}
                className={`relative shrink-0 px-3 pb-2.5 pt-1 text-sm transition-colors ${
                  item.id === category
                    ? 'font-semibold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-filters */}
        <div className="flex flex-wrap items-center gap-2">
          {stockDisplayOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStockDisplay(item.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                item.value === stockDisplay
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <Input
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder="브랜드"
              className="h-8 w-24 text-xs md:w-32"
            />
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                초기화
              </button>
            ) : null}
          </div>
        </div>

        {/* Result count */}
        {!showProductsSkeleton && !productsQuery.isError ? (
          <p className="text-xs text-muted-foreground">
            {totalItems.toLocaleString()}개 상품
          </p>
        ) : null}

        {showProductsSkeleton ? <p className="sr-only">상품 목록을 불러오는 중...</p> : null}
        {productsQuery.isError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            상품 조회에 실패했습니다. 잠시 후 다시 시도해주세요.
          </div>
        ) : null}

        {/* Product grid */}
        {showProductsSkeleton ? (
          <section
            data-testid="catalog-skeleton-grid"
            role="status"
            aria-live="polite"
            className="grid min-h-68 grid-cols-2 gap-x-3 gap-y-6 md:gap-x-5 md:gap-y-8 lg:grid-cols-4"
          >
            {Array.from({ length: placeholderCardCount }, (_, index) => (
              <div key={index}>
                <Skeleton className="aspect-square w-full rounded-lg" />
                <div className="mt-3 space-y-1.5">
                  <Skeleton className="h-3 w-2/5" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </section>
        ) : showEmptyFallback ? (
          <section className="flex flex-col items-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <SearchIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              조건에 맞는 상품이 없습니다
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              검색어 또는 필터를 조정해보세요.
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-4 text-sm font-medium text-primary underline underline-offset-2"
              >
                초기화
              </button>
            ) : null}
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-x-3 gap-y-6 md:gap-x-5 md:gap-y-8 lg:grid-cols-4">
              {visibleItems.map((item) => {
                const unavailable = !item.isActive || item.stockDisplay === 'out_of_stock'
                return (
                  <article key={item.id} className="group">
                    <Link
                      to="/products/$productId"
                      params={{ productId: item.id }}
                      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-lg"
                    >
                      <div className="relative overflow-hidden rounded-lg bg-muted">
                        <img
                          src={item.thumbUrl}
                          alt={item.name}
                          className={`aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none ${unavailable ? 'opacity-50 grayscale-[0.3]' : ''}`}
                        />
                        <StockBadge isActive={item.isActive} stockDisplay={item.stockDisplay} />
                      </div>
                      <div className="mt-2.5 md:mt-3">
                        <p className="text-[11px] text-muted-foreground md:text-xs">{item.brand}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-foreground md:text-sm">
                          {item.name}
                        </p>
                        <p className="mt-1.5 text-sm font-bold tracking-tight text-foreground md:text-base">
                          {formatPrice(item.price)}
                        </p>
                        {item.stockDisplay === 'low_stock' && item.isActive ? (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            잔여 {item.availableStock}개
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </article>
                )
              })}
            </section>

            {/* Pagination */}
            <nav
              aria-label="페이지 네비게이션"
              className="flex items-center justify-center gap-0.5 py-6"
            >
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                aria-label="처음"
              >
                <ChevronsLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                aria-label="이전"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  aria-current={pageNumber === page ? 'page' : undefined}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-full px-1 text-sm transition-colors ${
                    pageNumber === page
                      ? 'bg-foreground font-semibold text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                aria-label="다음"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                aria-label="마지막"
              >
                <ChevronsRightIcon className="h-4 w-4" />
              </button>
            </nav>
          </>
        )}
      </section>
    </main>
  )
}

function StockBadge({
  isActive,
  stockDisplay,
}: Readonly<{
  isActive: boolean
  stockDisplay: string
}>) {
  if (isActive && stockDisplay === 'in_stock') return null

  const label = !isActive
    ? '판매종료'
    : stockDisplay === 'out_of_stock'
      ? '품절'
      : '재고임박'

  const colorClass = stockDisplay === 'low_stock' && isActive
    ? 'bg-amber-500 text-white'
    : 'bg-foreground/75 text-background'

  return (
    <span className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium leading-normal backdrop-blur-sm ${colorClass}`}>
      {label}
    </span>
  )
}
