import { queryOptions } from '@tanstack/react-query'
import {
  getCatalogCategories,
  getCatalogProductDetail,
  getCatalogProducts,
  searchCatalogProducts,
  type CatalogListParams,
} from '~/@shared/api/catalog'

export const catalogQueryKeys = {
  categories: ['catalog', 'categories'] as const,
  list: (params: CatalogListParams) => ['catalog', 'list', params] as const,
  search: (params: CatalogListParams & { q: string }) => ['catalog', 'search', params] as const,
  detail: (productId: string) => ['catalog', 'detail', productId] as const,
}

export const catalogCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: catalogQueryKeys.categories,
    queryFn: getCatalogCategories,
    staleTime: 60_000,
  })

export const catalogListQueryOptions = (params: CatalogListParams) =>
  queryOptions({
    queryKey: catalogQueryKeys.list(params),
    queryFn: () => getCatalogProducts(params),
    staleTime: 30_000,
  })

export const catalogSearchQueryOptions = (params: CatalogListParams & { q: string }) =>
  queryOptions({
    queryKey: catalogQueryKeys.search(params),
    queryFn: () => searchCatalogProducts(params),
    staleTime: 30_000,
  })

export const catalogDetailQueryOptions = (productId: string) =>
  queryOptions({
    queryKey: catalogQueryKeys.detail(productId),
    queryFn: () => getCatalogProductDetail(productId),
    staleTime: 60_000,
  })
