import { z } from 'zod'

export const stockDisplaySchema = z.enum(['in_stock', 'low_stock', 'out_of_stock'])

export const catalogCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  displayOrder: z.int().nonnegative(),
  isActive: z.boolean(),
})

export const catalogProductSummarySchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  name: z.string(),
  brand: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  price: z.int().nonnegative(),
  weight: z.int().nonnegative(),
  isActive: z.boolean(),
  stockDisplay: stockDisplaySchema,
  isSubstitutable: z.boolean(),
  thumbUrl: z.url(),
  detailUrl: z.url(),
  availableStock: z.int().nonnegative(),
  canPurchase: z.boolean(),
})

export const catalogProductDetailSchema = catalogProductSummarySchema.extend({
  description: z.string(),
})

export const catalogProductListResponseSchema = z.object({
  items: z.array(catalogProductSummarySchema),
  page: z.int().positive(),
  pageSize: z.int().positive(),
  total: z.int().nonnegative(),
  totalPages: z.int().positive(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
})

export const catalogSearchResponseSchema = catalogProductListResponseSchema

export const catalogErrorSchema = z.object({
  code: z.string(),
  error: z.string(),
})
