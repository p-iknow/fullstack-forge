import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@fullstack-forge/design-system/components/badge'
import { Button } from '@fullstack-forge/design-system/components/button'
import { buttonVariants } from '@fullstack-forge/design-system/components/button'
import { Card, CardContent } from '@fullstack-forge/design-system/components/card'
import { Input } from '@fullstack-forge/design-system/components/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@fullstack-forge/design-system/components/table'
import { type CatalogProductStatus } from '~/lib/api/catalog'
import { readApiError } from '~/lib/api/core'
import {
  adminCategoriesQueryOptions,
  adminProductListQueryOptions,
  deleteProductMutationOptions,
  updateProductStatusMutationOptions,
} from '~/lib/queries/catalog'

type ProductFilterStatus = Extract<CatalogProductStatus, 'active' | 'low_stock'>

const formatPrice = (price: number) => `${new Intl.NumberFormat('ko-KR').format(price)}원`

const statusLabel: Record<CatalogProductStatus, string> = {
  active: '판매중',
  low_stock: '재고임박',
  out_of_stock: '품절',
  discontinued: '단종',
}

const statusBadgeVariant: Record<CatalogProductStatus, 'secondary' | 'outline' | 'destructive'> = {
  active: 'secondary',
  low_stock: 'outline',
  out_of_stock: 'destructive',
  discontinued: 'destructive',
}

const PAGE_SIZE = 20
const MAX_PAGE_BUTTONS = 5

export function AdminCatalogPage() {
  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    ...deleteProductMutationOptions(queryClient),
    onError: async (error) => {
      const apiError = await readApiError(error)
      alert(apiError.error || '상품 삭제에 실패했습니다')
    },
  })
  const updateStatusMutation = useMutation(updateProductStatusMutationOptions(queryClient))

  const [q, setQ] = useState('')
  const [submittedQ, setSubmittedQ] = useState('')
  const [status, setStatus] = useState<'all' | ProductFilterStatus>('all')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [page, setPage] = useState(1)

  const categoriesQuery = useQuery(adminCategoriesQueryOptions())
  const productsQuery = useQuery({
    ...adminProductListQueryOptions({
      q: submittedQ || undefined,
      status: status === 'all' ? undefined : status,
      category: category || undefined,
      brand: brand.trim() || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    setPage(1)
  }, [submittedQ, status, category, brand])

  const totalItems = productsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  const pageNumbers = useMemo(() => {
    const windowSize = Math.min(MAX_PAGE_BUTTONS, totalPages)
    const half = Math.floor(windowSize / 2)
    const start = Math.max(1, Math.min(page - half, totalPages - windowSize + 1))
    return Array.from({ length: windowSize }, (_, index) => start + index)
  }, [page, totalPages])

  useEffect(() => {
    if (productsQuery.data && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, productsQuery.data, totalPages])

  const distribution = useMemo(() => {
    const byCategory = new Map<string, number>()
    for (const item of productsQuery.data?.items ?? []) {
      byCategory.set(item.categoryName, (byCategory.get(item.categoryName) ?? 0) + 1)
    }
    return [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ko-KR'))
  }, [productsQuery.data])

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <Badge>admin catalog</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">상품 관리</h1>
          <p className="text-sm text-slate-600">
            목록 조회, 검색, 상태/카테고리 필터를 지원합니다.
          </p>
        </div>
        <Link to="/products/new" className={buttonVariants()}>
          상품 등록
        </Link>
      </header>

      <form
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmittedQ(q.trim())
        }}
      >
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="상품명/브랜드 검색"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
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
          onChange={(event) => setStatus(event.target.value as 'all' | ProductFilterStatus)}
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="all">전체 상태</option>
          <option value="active">판매중</option>
          <option value="low_stock">재고임박</option>
        </select>
        <Input
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          placeholder="브랜드 필터"
        />
        <Button type="submit" size="lg">
          조회
        </Button>
      </form>

      {productsQuery.isPending ? (
        <p className="mt-4 text-sm text-slate-500">데이터를 불러오는 중...</p>
      ) : null}
      {productsQuery.isError ? (
        <p className="mt-4 rounded bg-rose-100 p-3 text-sm text-rose-800">
          상품 데이터를 불러오지 못했습니다.
        </p>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {distribution.map(([name, count]) => (
          <Card key={name} size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">카테고리</p>
              <p className="mt-1 text-sm font-semibold">{name}</p>
              <p className="mt-2 text-xs text-muted-foreground">상품 {count}개</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>상품명</TableHead>
              <TableHead>브랜드</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>가격</TableHead>
              <TableHead>가용재고</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsQuery.data?.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.brand}</TableCell>
                <TableCell>{item.categoryName}</TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant[item.status]}>
                    {statusLabel[item.status]}
                  </Badge>
                </TableCell>
                <TableCell>{formatPrice(item.price)}</TableCell>
                <TableCell>{item.availableStock}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => {
                        updateStatusMutation.mutate({
                          id: item.id,
                          data: { status: e.target.value as CatalogProductStatus },
                        })
                      }}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
                      disabled={updateStatusMutation.isPending}
                    >
                      <option value="active">판매중</option>
                      <option value="low_stock">재고임박</option>
                      <option value="out_of_stock">품절</option>
                      <option value="discontinued">단종</option>
                    </select>
                    <Link
                      to="/products/$id/edit"
                      params={{ id: item.id }}
                      className={buttonVariants({
                        variant: 'outline',
                        size: 'sm',
                        className: 'h-8 px-2 text-xs',
                      })}
                    >
                      수정
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm('정말 삭제하시겠습니까?')) {
                          deleteMutation.mutate(item.id)
                        }
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-600">
          페이지 {page} / {totalPages} · 총 {totalItems}개
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page <= 1}
          >
            처음
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
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
              size="sm"
              onClick={() => setPage(pageNumber)}
              aria-current={pageNumber === page ? 'page' : undefined}
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page >= totalPages}
          >
            다음
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
          >
            마지막
          </Button>
        </div>
      </section>
    </main>
  )
}
