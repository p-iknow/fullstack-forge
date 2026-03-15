import { z } from 'zod'

export const cartStatusSchema = z.enum(['active', 'converted', 'expired'])
export const cartItemStockDisplaySchema = z.enum(['in_stock', 'low_stock', 'out_of_stock'])

export const cartItemSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  productName: z.string(),
  sku: z.string(),
  quantity: z.int().positive().max(15),
  unitPriceSnapshot: z.int().nonnegative(),
  isSubstitutable: z.boolean(),
  stockDisplay: cartItemStockDisplaySchema,
  availableStock: z.int().nonnegative(),
  thumbUrl: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const cartResponseSchema = z.object({
  id: z.uuid(),
  status: cartStatusSchema,
  itemCount: z.int().nonnegative(),
  totalAmount: z.int().nonnegative(),
  expiresAt: z.iso.datetime(),
  version: z.int(),
  items: z.array(cartItemSchema),
})

export const addCartItemRequestSchema = z.object({
  productId: z.uuid(),
  quantity: z.int().positive().max(15),
})

export const updateCartItemRequestSchema = z.object({
  quantity: z.int().positive().max(15),
})

export const cartErrorSchema = z.object({
  code: z.string(),
  error: z.string(),
})

export const cartItemIdParamsSchema = z.object({
  cartItemId: z.uuid(),
})
