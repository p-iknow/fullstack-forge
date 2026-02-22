import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/')({
  component: Home,
})

type ProductStatus = 'active' | 'low_stock' | 'out_of_stock' | 'discontinued'
type ProductFilterStatus = 'active' | 'low_stock'

type CatalogProduct = {
  id: string
  name: string
  categoryName: string
  brand: string
  status: ProductStatus
  price: number
  availableStock: number
}

type CatalogListResponse = {
  items: CatalogProduct[]
  total: number
}

type CategoryResponse = {
  items: Array<{ id: string; name: string }>
}

const formatPrice = (price: number) => `${new Intl.NumberFormat('ko-KR').format(price)}원`

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Request failed')
  }
  return (await response.json()) as T
}

function Home() {
  const [q, setQ] = useState('')
  const [submittedQ, setSubmittedQ] = useState('')
  const [status, setStatus] = useState<'all' | ProductFilterStatus>('all')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'catalog', 'categories'],
    queryFn: () => fetchJson<CategoryResponse>('/api/categories'),
    staleTime: 60_000,
  })

  const queryString = useMemo(() => {
    const query = new URLSearchParams()
    if (submittedQ) query.set('q', submittedQ)
    if (status !== 'all') query.set('status', status)
    if (category) query.set('category', category)
    if (brand.trim()) query.set('brand', brand.trim())
    query.set('page', '1')
    query.set('page_size', '20')
    return query.toString()
  }, [brand, category, status, submittedQ])

  const productsQuery = useQuery({
    queryKey: ['admin', 'catalog', 'list', queryString],
    queryFn: () => fetchJson<CatalogListResponse>(`/api/products${queryString ? `?${queryString}` : ''}`),
    staleTime: 30_000,
  })

  const distribution = useMemo(() => {
    const byCategory = new Map<string, number>()
    for (const item of productsQuery.data?.items ?? []) {
      byCategory.set(item.categoryName, (byCategory.get(item.categoryName) ?? 0) + 1)
    }
    return [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ko-KR'))
  }, [productsQuery.data])

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <header className="space-y-2">
        <p className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
          admin catalog
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">상품 관리</h1>
        <p className="text-sm text-slate-600">목록 조회, 검색, 상태/카테고리 필터를 지원합니다.</p>
      </header>

      <form
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmittedQ(q.trim())
        }}
      >
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="상품명/브랜드 검색"
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
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
          onChange={(event) => setStatus(event.target.value as 'all' | ProductFilterStatus)}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="all">전체 상태</option>
          <option value="active">판매중</option>
          <option value="low_stock">재고임박</option>
        </select>
        <input
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          placeholder="브랜드 필터"
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        />
        <button type="submit" className="h-10 rounded-md bg-slate-900 px-3 text-sm font-medium text-white">
          조회
        </button>
      </form>

      {productsQuery.isPending ? <p className="mt-4 text-sm text-slate-500">데이터를 불러오는 중...</p> : null}
      {productsQuery.isError ? (
        <p className="mt-4 rounded bg-rose-100 p-3 text-sm text-rose-800">상품 데이터를 불러오지 못했습니다.</p>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {distribution.map(([name, count]) => (
          <article key={name} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">카테고리</p>
            <p className="mt-1 text-sm font-semibold">{name}</p>
            <p className="mt-2 text-xs text-slate-600">상품 {count}개</p>
          </article>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">상품명</th>
              <th className="px-4 py-3">브랜드</th>
              <th className="px-4 py-3">카테고리</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">가격</th>
              <th className="px-4 py-3">가용재고</th>
            </tr>
          </thead>
          <tbody>
            {productsQuery.data?.items.map((item) => (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.brand}</td>
                <td className="px-4 py-3">{item.categoryName}</td>
                <td className="px-4 py-3">{item.status}</td>
                <td className="px-4 py-3">{formatPrice(item.price)}</td>
                <td className="px-4 py-3">{item.availableStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
