import type { RouteHandler } from '@hono/zod-openapi'
import {
  getProductByIdRoute,
  getProductsRoute,
  searchProductsRoute,
  getCategoriesRoute,
} from '@fullstack-forge/api-spec/routes/catalog'
import { desc, eq } from 'drizzle-orm'
import { db } from '~/db/client'
import { inventory, products } from '~/db/schema/index'
import { findCatalogCategory, getCatalogCategoryById, getDbCategories } from './@shared/categories'
import type { CatalogCategory } from './@shared/categories'
import {
  getAvailableStock,
  getCanPurchase,
  getProductBrand,
  getProductImageUrls,
  getProductSku,
  getProductWeight,
  getStockDisplay,
  type StockDisplay,
} from './@shared/view-model'

type CatalogProduct = {
  id: string
  sku: string
  name: string
  description: string
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
  createdAt: Date
}

type CatalogProductRow = {
  id: string
  sku?: string | null
  name: string
  description: string
  brand?: string | null
  price: number
  weight?: number | null
  isActive: boolean
  categoryId?: string | null
  thumbUrl?: string | null
  detailUrl?: string | null
  isSubstitutable?: boolean
  createdAt: Date
  onHand: number | null
  reserved: number | null
  safetyThreshold: number | null
}

const normalizeKeyword = (value: string | undefined) => value?.trim().toLowerCase() ?? ''

const parseListQuery = (query: {
  q?: string
  category?: string
  isActive?: boolean
  stockDisplay?: StockDisplay
  brand?: string
  sort?: 'latest' | 'price' | 'name'
  order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}) => {
  return {
    q: normalizeKeyword(query.q),
    category: normalizeKeyword(query.category),
    isActive: query.isActive,
    stockDisplay: query.stockDisplay,
    brand: normalizeKeyword(query.brand),
    sort: query.sort ?? 'latest',
    order: query.order ?? 'desc',
    page: query.page ?? 1,
    pageSize: query.page_size ?? 20,
  }
}

const selectCatalogProductRowsWithImageColumns = async (): Promise<CatalogProductRow[]> => {
  return db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      description: products.description,
      brand: products.brand,
      price: products.price,
      weight: products.weight,
      isActive: products.isActive,
      categoryId: products.categoryId,
      thumbUrl: products.thumbUrl,
      detailUrl: products.detailUrl,
      isSubstitutable: products.isSubstitutable,
      createdAt: products.createdAt,
      onHand: inventory.onHand,
      reserved: inventory.reserved,
      safetyThreshold: inventory.safetyThreshold,
    })
    .from(products)
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .orderBy(desc(products.createdAt))
}

const loadCatalogProducts = async (categoryList: CatalogCategory[]): Promise<CatalogProduct[]> => {
  const rows = await selectCatalogProductRowsWithImageColumns()

  return rows.map((row) => {
    const category = getCatalogCategoryById(categoryList, row.categoryId)
    const availableStock = getAvailableStock(row.onHand, row.reserved)
    const stockDisplay = getStockDisplay(availableStock, row.safetyThreshold ?? 5)
    const brand = row.brand ?? getProductBrand(category, row.name)
    const generatedImageUrls = getProductImageUrls(row.id)
    const thumbUrl = row.thumbUrl ?? generatedImageUrls.thumbUrl
    const detailUrl = row.detailUrl ?? generatedImageUrls.detailUrl

    return {
      id: row.id,
      sku: row.sku ?? getProductSku(row.id),
      name: row.name,
      description: row.description,
      brand,
      categoryId: category?.id ?? 'cat-unknown',
      categoryName: category?.name ?? '미분류',
      price: row.price,
      weight: row.weight ?? getProductWeight(row.price),
      isActive: row.isActive,
      stockDisplay,
      isSubstitutable: row.isSubstitutable ?? true,
      thumbUrl,
      detailUrl,
      availableStock,
      canPurchase: getCanPurchase({ isActive: row.isActive, availableStock, category }),
      createdAt: row.createdAt,
    }
  })
}

const filterCatalogProducts = (
  productsList: CatalogProduct[],
  categoryList: CatalogCategory[],
  filters: {
    q: string
    category: string
    isActive?: boolean
    stockDisplay?: StockDisplay
    brand: string
  },
) => {
  const { q, category, isActive, stockDisplay, brand } = filters
  const categoryMatch = findCatalogCategory(category, categoryList)

  return productsList.filter((item) => {
    if (q) {
      const containsQuery =
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      if (!containsQuery) {
        return false
      }
    }

    if (category) {
      if (categoryMatch) {
        if (item.categoryId !== categoryMatch.id) {
          return false
        }
      } else {
        return false
      }
    }

    if (isActive !== undefined && item.isActive !== isActive) {
      return false
    }

    if (stockDisplay && item.stockDisplay !== stockDisplay) {
      return false
    }

    if (brand && !item.brand.toLowerCase().includes(brand)) {
      return false
    }

    return true
  })
}

const sortCatalogProducts = (
  items: CatalogProduct[],
  sort: 'latest' | 'price' | 'name',
  order: 'asc' | 'desc',
) => {
  const direction = order === 'asc' ? 1 : -1

  const sorted = [...items]
  sorted.sort((a, b) => {
    if (sort === 'price') {
      return (a.price - b.price) * direction
    }
    if (sort === 'name') {
      return a.name.localeCompare(b.name, 'ko-KR') * direction
    }
    return (a.createdAt.getTime() - b.createdAt.getTime()) * direction
  })
  return sorted
}

const toProductSummary = (item: CatalogProduct) => ({
  id: item.id,
  sku: item.sku,
  name: item.name,
  brand: item.brand,
  categoryId: item.categoryId,
  categoryName: item.categoryName,
  price: item.price,
  weight: item.weight,
  isActive: item.isActive,
  stockDisplay: item.stockDisplay,
  isSubstitutable: item.isSubstitutable,
  thumbUrl: item.thumbUrl,
  detailUrl: item.detailUrl,
  availableStock: item.availableStock,
  canPurchase: item.canPurchase,
})

const toPaginationMeta = ({
  page,
  pageSize,
  total,
}: {
  page: number
  pageSize: number
  total: number
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  }
}

export const getProductsHandler: RouteHandler<typeof getProductsRoute> = async (c) => {
  const query = parseListQuery(c.req.valid('query'))
  const categoryList = await getDbCategories()
  const loaded = await loadCatalogProducts(categoryList)
  const filtered = filterCatalogProducts(loaded, categoryList, query)
  const sorted = sortCatalogProducts(filtered, query.sort, query.order)

  const categoryDistribution: Record<string, number> = {}
  for (const item of sorted) {
    categoryDistribution[item.categoryName] = (categoryDistribution[item.categoryName] ?? 0) + 1
  }

  const start = (query.page - 1) * query.pageSize
  const end = start + query.pageSize

  return c.json(
    {
      items: sorted.slice(start, end).map(toProductSummary),
      categoryDistribution,
      ...toPaginationMeta({
        page: query.page,
        pageSize: query.pageSize,
        total: sorted.length,
      }),
    },
    200,
  )
}

export const searchProductsHandler: RouteHandler<typeof searchProductsRoute> = async (c) => {
  const query = parseListQuery(c.req.valid('query'))
  if (!query.q) {
    return c.json({ code: 'catalog_invalid_query', error: 'Search query is required' }, 400)
  }

  const categoryList = await getDbCategories()
  const loaded = await loadCatalogProducts(categoryList)
  const filtered = filterCatalogProducts(loaded, categoryList, query)
  const sorted = sortCatalogProducts(filtered, query.sort, query.order)

  const start = (query.page - 1) * query.pageSize
  const end = start + query.pageSize

  return c.json(
    {
      items: sorted.slice(start, end).map(toProductSummary),
      ...toPaginationMeta({
        page: query.page,
        pageSize: query.pageSize,
        total: sorted.length,
      }),
    },
    200,
  )
}

export const getProductByIdHandler: RouteHandler<typeof getProductByIdRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const categoryList = await getDbCategories()
  const loaded = await loadCatalogProducts(categoryList)
  const found = loaded.find((item) => item.id === id)

  if (!found) {
    return c.json({ code: 'catalog_product_not_found', error: 'Product not found' }, 404)
  }

  return c.json(
    {
      ...toProductSummary(found),
      description: found.description,
    },
    200,
  )
}

export const getCategoriesHandler: RouteHandler<typeof getCategoriesRoute> = async (c) => {
  const categoryList = await getDbCategories()

  return c.json(
    {
      items: categoryList,
    },
    200,
  )
}
