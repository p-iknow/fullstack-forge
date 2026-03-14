import { z } from 'zod'
import { stockDisplaySchema } from './catalog-schemas'

// ── Category schemas ──

export const createCategoryRequestSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  displayOrder: z.int().nonnegative(),
  isActive: z.boolean().optional().default(true),
})

export const updateCategoryRequestSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  displayOrder: z.int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

export const adminCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  displayOrder: z.int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string(),
})

export const adminCategoryListResponseSchema = z.object({
  items: z.array(adminCategorySchema),
})

// ── Product write schemas ──

export const createProductRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  brand: z.string().min(1).optional(),
  price: z.int().positive(),
  weight: z.int().positive().optional(),
  categoryId: z.uuid(),
  isSubstitutable: z.boolean().optional().default(true),
})

export const updateProductRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  price: z.int().positive().optional(),
  weight: z.int().positive().optional(),
  categoryId: z.uuid().optional(),
  isSubstitutable: z.boolean().optional(),
})

export const updateProductActiveRequestSchema = z.object({
  isActive: z.boolean(),
})

export const adminProductResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  sku: z.string().nullable(),
  brand: z.string().nullable(),
  price: z.int().nonnegative(),
  weight: z.int().nullable(),
  isActive: z.boolean(),
  stockDisplay: stockDisplaySchema,
  categoryId: z.string().nullable(),
  thumbUrl: z.string().nullable(),
  detailUrl: z.string().nullable(),
  isSubstitutable: z.boolean(),
  createdAt: z.string(),
})

export const adminProductImageResponseSchema = z.object({
  thumbUrl: z.string(),
  detailUrl: z.string(),
})

// ── Shared error schema ──

export const adminCatalogErrorSchema = z.object({
  code: z.string(),
  error: z.string(),
})
