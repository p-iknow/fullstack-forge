import { z } from 'zod'

export const stockDisplaySchema = z.enum(['in_stock', 'low_stock', 'out_of_stock'])

export const catalogCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  displayOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
})

export const catalogProductSummarySchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  brand: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  price: z.number().int().nonnegative(),
  weight: z.number().int().nonnegative(),
  isActive: z.boolean(),
  stockDisplay: stockDisplaySchema,
  isSubstitutable: z.boolean(),
  thumbUrl: z.string().url(),
  detailUrl: z.string().url(),
  availableStock: z.number().int().nonnegative(),
  canPurchase: z.boolean(),
})

export const catalogProductDetailSchema = catalogProductSummarySchema.extend({
  description: z.string(),
})

export const catalogProductListResponseSchema = z.object({
  items: z.array(catalogProductSummarySchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
})

export const catalogSearchResponseSchema = catalogProductListResponseSchema

export const catalogErrorSchema = z.object({
  code: z.string(),
  error: z.string(),
})
