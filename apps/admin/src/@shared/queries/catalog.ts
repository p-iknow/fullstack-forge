import { queryOptions, mutationOptions, type QueryClient } from '@tanstack/react-query'
import {
  getAdminCatalogProducts,
  getAdminProduct,
  getAdminCategories,
  getAdminCategoriesFull,
  createAdminProduct,
  updateAdminProduct,
  updateAdminProductActive,
  deleteAdminProduct,
  uploadProductImages,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  type CatalogListParams,
  type CreateProductInput,
  type UpdateProductInput,
  type UpdateProductActiveInput,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '~/@shared/api/catalog'

export const adminCatalogQueryKeys = {
  categories: ['admin', 'catalog', 'categories'] as const,
  categoriesFull: ['admin', 'catalog', 'categories', 'full'] as const,
  list: (params: CatalogListParams) => ['admin', 'catalog', 'list', params] as const,
  detail: (id: string) => ['admin', 'catalog', 'detail', id] as const,
}

export const adminCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: adminCatalogQueryKeys.categories,
    queryFn: getAdminCategories,
    staleTime: 60_000,
  })

export const adminProductListQueryOptions = (params: CatalogListParams) =>
  queryOptions({
    queryKey: adminCatalogQueryKeys.list(params),
    queryFn: () => getAdminCatalogProducts(params),
    staleTime: 30_000,
  })
export const adminProductQueryOptions = (id: string) =>
  queryOptions({
    queryKey: adminCatalogQueryKeys.detail(id),
    queryFn: () => getAdminProduct(id),
    staleTime: 30_000,
  })

export const adminCategoriesFullQueryOptions = () =>
  queryOptions({
    queryKey: adminCatalogQueryKeys.categoriesFull,
    queryFn: getAdminCategoriesFull,
    staleTime: 60_000,
  })

export const createProductMutationOptions = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (data: CreateProductInput) => createAdminProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'list'] })
    },
  })

export const updateProductMutationOptions = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) =>
      updateAdminProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'list'] })
    },
  })

export const updateProductActiveMutationOptions = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductActiveInput }) =>
      updateAdminProductActive(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'list'] })
    },
  })

export const deleteProductMutationOptions = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'list'] })
    },
  })

export const uploadProductImagesMutationOptions = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, thumbFile, detailFile }: { id: string; thumbFile: File; detailFile: File }) =>
      uploadProductImages(id, thumbFile, detailFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'list'] })
    },
  })

export const createCategoryMutationOptions = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (data: CreateCategoryInput) => createAdminCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.categories })
      queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.categoriesFull })
    },
  })

export const updateCategoryMutationOptions = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) =>
      updateAdminCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.categories })
      queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.categoriesFull })
    },
  })

export const deleteCategoryMutationOptions = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.categories })
      queryClient.invalidateQueries({ queryKey: adminCatalogQueryKeys.categoriesFull })
    },
  })
