import { useEffect, useMemo, useRef, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Button } from '@fullstack-forge/design-system/components/button'
import { Input } from '@fullstack-forge/design-system/components/input'
import { Skeleton } from '@fullstack-forge/design-system/components/skeleton'
import { CatalogTopNav } from '~/screens/catalog/catalog-top-nav'
import {
  catalogCategoriesQueryOptions,
  catalogListQueryOptions,
  catalogSearchQueryOptions,
} from '~/lib/queries/catalog'

type CatalogStatus = 'all' | 'active' | 'low_stock'

const statusOptions: Array<{ value: CatalogStatus; label: string }> = [
  { value: 'all', label: '전체 상태' },
  { value: 'active', label: '판매중' },
  { value: 'low_stock', label: '재고임박' },
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
  const [status, setStatus] = useState<CatalogStatus>('all')
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
      status: status === 'all' ? undefined : status,
      brand: brand || undefined,
      page,
      pageSize,
      sort: 'latest' as const,
      order: 'desc' as const,
    }),
    [brand, category, page, status],
  )

  useEffect(() => {
    setPage(1)
  }, [category, status, brand, submittedKeyword])

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
  const visibleItems = productsQuery.data?.items ?? []
  const hasActiveFilters = Boolean(submittedKeyword || category || brand || status !== 'all')
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <CatalogTopNav />

        <header className="space-y-3">
          <p className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
            catalog stage 2
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">상품 카탈로그</h1>
          <p className="text-sm text-slate-600">
            카테고리, 브랜드, 상태 기준으로 상품을 탐색하세요.
          </p>
        </header>

        <form
          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault()
            setSubmittedKeyword(keyword.trim())
          }}
        >
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="검색어 (상품명, 브랜드, SKU)"
            className="md:col-span-2"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">전체 카테고리</option>
            {categoriesQuery.data?.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as CatalogStatus)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Input
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder="브랜드"
              className="min-w-0"
            />
            <Button type="submit">검색</Button>
          </div>
        </form>

        {showProductsSkeleton ? <p className="sr-only">상품 목록을 불러오는 중...</p> : null}
        {productsQuery.isError ? (
          <p className="rounded bg-rose-100 p-3 text-sm text-rose-800">상품 조회에 실패했습니다.</p>
        ) : null}

        {showProductsSkeleton ? (
          <section
            data-testid="catalog-skeleton-grid"
            role="status"
            aria-live="polite"
            className="grid min-h-68 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {Array.from({ length: placeholderCardCount }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <Skeleton className="aspect-square w-full rounded-none bg-slate-200!" />
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-3/5 bg-slate-300!" />
                    <Skeleton className="h-5 w-14 rounded-full bg-slate-300!" />
                  </div>
                  <Skeleton className="h-3 w-2/5 bg-slate-300!" />
                  <Skeleton className="h-4 w-1/3 bg-slate-300!" />
                  <Skeleton className="h-3 w-1/2 bg-slate-300!" />
                  <div className="pt-1">
                    <Skeleton className="h-4 w-16 bg-slate-300!" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : showEmptyFallback ? (
          <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              조건에 맞는 상품이 없습니다
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              검색어 또는 필터를 조정하면 다른 상품을 찾을 수 있어요.
            </p>
            {hasActiveFilters ? (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setKeyword('')
                    setSubmittedKeyword('')
                    setCategory('')
                    setStatus('all')
                    setBrand('')
                    setPage(1)
                  }}
                >
                  검색/필터 초기화
                </Button>
              </div>
            ) : null}
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleItems.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <a
                    href={`/products/${item.id}`}
                    className="block transition-colors hover:bg-slate-50 focus-visible:outline-none"
                  >
                    <img
                      src={item.thumbUrl}
                      alt={item.name}
                      className="aspect-square w-full bg-slate-100 object-cover"
                    />
                    <div className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{item.name}</p>
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                            item.status === 'out_of_stock' || item.status === 'discontinued'
                              ? 'bg-rose-100 text-rose-700'
                              : item.status === 'low_stock'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.status === 'out_of_stock'
                            ? '품절'
                            : item.status === 'discontinued'
                              ? '단종'
                              : item.status === 'low_stock'
                                ? '재고임박'
                                : '판매중'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{item.brand}</p>
                      <p className="text-sm font-semibold">{formatPrice(item.price)}</p>
                      <p className="text-xs text-slate-500">가용 재고 {item.availableStock}개</p>
                    </div>
                  </a>
                </article>
              ))}
            </section>

            <section className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm text-slate-600">
                페이지 {page} / {totalPages} · 총 {totalItems}개
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                >
                  처음
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage((prev) => prev - 1)}
                  disabled={page <= 1}
                >
                  이전
                </Button>
                {pageNumbers.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    type="button"
                    variant={pageNumber === page ? 'default' : 'outline'}
                    onClick={() => setPage(pageNumber)}
                    aria-current={pageNumber === page ? 'page' : undefined}
                  >
                    {pageNumber}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={page >= totalPages}
                >
                  다음
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                >
                  마지막
                </Button>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  )
}
