import { ApiClientError } from '~/lib/api/core'

export type CatalogProductStatus = 'active' | 'low_stock' | 'out_of_stock' | 'discontinued'

export type CatalogProduct = {
  id: string
  name: string
  categoryName: string
  brand: string
  status: CatalogProductStatus
  price: number
  availableStock: number
}

export type CatalogListParams = {
  q?: string
  category?: string
  status?: CatalogProductStatus
  brand?: string
  page?: number
  pageSize?: number
}

export type CatalogListResponse = {
  items: CatalogProduct[]
  total: number
}

export type CategoryItem = {
  id: string
  name: string
}

export type CategoryResponse = {
  items: CategoryItem[]
}

const toQueryString = (params: CatalogListParams) => {
  const query = new URLSearchParams()

  if (params.q) query.set('q', params.q)
  if (params.category) query.set('category', params.category)
  if (params.status) query.set('status', params.status)
  if (params.brand) query.set('brand', params.brand)
  if (params.page) query.set('page', String(params.page))
  if (params.pageSize) query.set('page_size', String(params.pageSize))

  return query.toString()
}

const requestJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
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

export const getAdminCatalogProducts = async (
  params: CatalogListParams,
): Promise<CatalogListResponse> => {
  const qs = toQueryString(params)
  const url = qs ? `/api/products?${qs}` : '/api/products'
  return requestJson<CatalogListResponse>(url)
}

export const getAdminCategories = async (): Promise<CategoryResponse> => {
  return requestJson<CategoryResponse>('/api/categories')
}
export const getAdminProduct = async (id: string): Promise<AdminProduct> => {
  return requestJson<AdminProduct>(`/api/products/${id}`)
}

export const createAdminProduct = async (data: CreateProductInput): Promise<AdminProduct> => {
  return requestMutate<AdminProduct>('/api/admin/products', 'POST', data)
}

export const updateAdminProduct = async (
  id: string,
  data: UpdateProductInput,
): Promise<AdminProduct> => {
  return requestMutate<AdminProduct>(`/api/admin/products/${id}`, 'PATCH', data)
}

export const updateAdminProductStatus = async (
  id: string,
  data: UpdateProductStatusInput,
): Promise<AdminProduct> => {
  return requestMutate<AdminProduct>(`/api/admin/products/${id}/status`, 'PATCH', data)
}

export const deleteAdminProduct = async (id: string): Promise<void> => {
  return requestMutate<void>(`/api/admin/products/${id}`, 'DELETE')
}

export const uploadProductImages = async (
  id: string,
  file: File,
): Promise<{ thumbUrl: string; detailUrl: string }> => {
  const formData = new FormData()
  formData.append('image', file)
  return requestMutate<{ thumbUrl: string; detailUrl: string }>(
    `/api/admin/products/${id}/images`,
    'POST',
    formData,
  )
}

export const getAdminCategoriesFull = async (): Promise<AdminCategoryListResponse> => {
  return requestJson<AdminCategoryListResponse>('/api/admin/categories')
}

export const createAdminCategory = async (data: CreateCategoryInput): Promise<AdminCategory> => {
  return requestMutate<AdminCategory>('/api/admin/categories', 'POST', data)
}

export const updateAdminCategory = async (
  id: string,
  data: UpdateCategoryInput,
): Promise<AdminCategory> => {
  return requestMutate<AdminCategory>(`/api/admin/categories/${id}`, 'PATCH', data)
}

export const deleteAdminCategory = async (id: string): Promise<void> => {
  return requestMutate<void>(`/api/admin/categories/${id}`, 'DELETE')
}

export type AdminCategory = {
  id: string
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
  createdAt: string
}

export type AdminCategoryListResponse = {
  items: AdminCategory[]
}

export type AdminProduct = {
  id: string
  name: string
  description: string
  price: number
  status: CatalogProductStatus
  categoryId: string | null
  thumbUrl: string | null
  detailUrl: string | null
  isSubstitutable: boolean
  createdAt: string
}

export type CreateProductInput = {
  name: string
  description: string
  price: number
  categoryId: string
  isSubstitutable?: boolean
}

export type UpdateProductInput = Partial<CreateProductInput>

export type UpdateProductStatusInput = {
  status: CatalogProductStatus
}

export type CreateCategoryInput = {
  name: string
  slug: string
  displayOrder: number
  isActive?: boolean
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>

const requestMutate = async <T>(url: string, method: string, body?: unknown): Promise<T> => {
  const response = await fetch(url, {
    method,
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })

  if (method === 'DELETE' && response.status === 204) {
    return undefined as T
  }

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

  if (!payload && method !== 'DELETE') {
    throw new ApiClientError({ error: 'Empty response' }, 'Catalog request failed')
  }

  return payload as T
}
