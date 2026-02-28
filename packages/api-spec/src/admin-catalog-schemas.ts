import { z } from 'zod'
import { catalogProductStatusSchema } from './catalog-schemas'

// ── Category schemas ──

export const createCategoryRequestSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  displayOrder: z.number().int().nonnegative(),
  isActive: z.boolean().optional().default(true),
})

export const updateCategoryRequestSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  displayOrder: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

export const adminCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  displayOrder: z.number().int().nonnegative(),
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
  price: z.number().int().positive(),
  weight: z.number().int().positive().optional(),
  categoryId: z.string().uuid(),
  isSubstitutable: z.boolean().optional().default(true),
})

export const updateProductRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  weight: z.number().int().positive().optional(),
  categoryId: z.string().uuid().optional(),
  isSubstitutable: z.boolean().optional(),
})

export const updateProductStatusRequestSchema = z.object({
  status: catalogProductStatusSchema,
})

export const adminProductResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  sku: z.string().nullable(),
  brand: z.string().nullable(),
  price: z.number().int().nonnegative(),
  weight: z.number().int().nullable(),
  status: catalogProductStatusSchema,
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
