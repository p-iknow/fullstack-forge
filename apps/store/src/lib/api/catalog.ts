import { ApiClientError, fetchWithRefresh } from '~/lib/api/core'

export type StockDisplay = 'in_stock' | 'low_stock' | 'out_of_stock'

export type CatalogCategory = {
  id: string
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
}

export type CatalogProductSummary = {
  id: string
  sku: string
  name: string
  brand: string
  categoryId: string
  categoryName: string
  price: number
  weight: number
  isActive: boolean
  stockDisplay: StockDisplay
  isSubstitutable: boolean
  thumbUrl: string
  detailUrl: string
  availableStock: number
  canPurchase: boolean
}

export type CatalogProductDetail = CatalogProductSummary & {
  description: string
}

export type CatalogListParams = {
  q?: string
  category?: string
  isActive?: boolean
  stockDisplay?: StockDisplay
  brand?: string
  sort?: 'latest' | 'price' | 'name'
  order?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export type CatalogListResponse = {
  items: CatalogProductSummary[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

const toQueryString = (params: CatalogListParams) => {
  const query = new URLSearchParams()

  if (params.q) query.set('q', params.q)
  if (params.category) query.set('category', params.category)
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive))
  if (params.stockDisplay) query.set('stockDisplay', params.stockDisplay)
  if (params.brand) query.set('brand', params.brand)
  if (params.sort) query.set('sort', params.sort)
  if (params.order) query.set('order', params.order)
  if (params.page) query.set('page', String(params.page))
  if (params.pageSize) query.set('page_size', String(params.pageSize))

  return query.toString()
}

const requestJson = async <T>(url: string): Promise<T> => {
  const response = await fetchWithRefresh(url, {
    method: 'GET',
    credentials: 'include',
  })

  const payload = (await response.json().catch(() => null)) as {
    code?: string
    error?: string
  } | null

  if (!response.ok) {
    throw new ApiClientError(
      {
        code: payload?.code,
        error: payload?.error ?? `Request failed (${response.status})`,
      },
      'Catalog request failed',
    )
  }

  if (!payload) {
    throw new ApiClientError({ error: 'Empty response' }, 'Catalog request failed')
  }

  return payload as T
}

export const getCatalogProducts = async (
  params: CatalogListParams,
): Promise<CatalogListResponse> => {
  const qs = toQueryString(params)
  const url = qs ? `/api/products?${qs}` : '/api/products'
  return requestJson<CatalogListResponse>(url)
}

export const searchCatalogProducts = async (
  params: CatalogListParams & { q: string },
): Promise<CatalogListResponse> => {
  const qs = toQueryString(params)
  const url = qs ? `/api/products/search?${qs}` : '/api/products/search'
  return requestJson<CatalogListResponse>(url)
}

export const getCatalogProductDetail = async (productId: string): Promise<CatalogProductDetail> => {
  return requestJson<CatalogProductDetail>(`/api/products/${productId}`)
}

export const getCatalogCategories = async (): Promise<{ items: CatalogCategory[] }> => {
  return requestJson<{ items: CatalogCategory[] }>('/api/categories')
}
