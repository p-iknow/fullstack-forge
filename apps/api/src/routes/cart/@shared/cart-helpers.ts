import { and, eq, sql } from 'drizzle-orm'
import { db } from '~/db/client'
import { cartItems, carts, categories, inventory, products } from '~/db/schema/index'

type CartErrorCode =
  | 'version_conflict'
  | 'product_unavailable'
  | 'cart_not_active'
  | 'quantity_exceeded'
  | 'max_items_exceeded'
  | 'item_not_found'

export type CartErrorPayload = {
  code: CartErrorCode
  error: string
  status: 400 | 404 | 409 | 422
}

type CartItemStockDisplay = 'in_stock' | 'low_stock' | 'out_of_stock'

const createCartError = (
  code: CartErrorCode,
  error: string,
  status: CartErrorPayload['status'],
): CartErrorPayload => ({
  code,
  error,
  status,
})

export const isCartErrorPayload = (value: unknown): value is CartErrorPayload => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<CartErrorPayload>
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.error === 'string' &&
    (candidate.status === 400 || candidate.status === 404 || candidate.status === 409 || candidate.status === 422)
  )
}

const getStockDisplay = (availableStock: number, safetyThreshold: number): CartItemStockDisplay => {
  if (availableStock <= 0) {
    return 'out_of_stock'
  }

  if (availableStock <= safetyThreshold) {
    return 'low_stock'
  }

  return 'in_stock'
}

export const getOrCreateActiveCart = async (userId: string) => {
  const [existingCart] = await db
    .select()
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, 'active')))
    .limit(1)

  if (existingCart) {
    return existingCart
  }

  const [createdCart] = await db
    .insert(carts)
    .values({
      userId,
      status: 'active',
      version: 1,
      expiresAt: sql`now() + interval '7 days'`,
    })
    .returning()

  return createdCart
}

export const refreshCartExpiry = async (cartId: string, currentVersion: number) => {
  const updatedRows = await db
    .update(carts)
    .set({
      expiresAt: sql`now() + interval '7 days'`,
      lastActiveAt: sql`now()`,
      version: sql`${carts.version} + 1`,
      updatedAt: sql`now()`,
    })
    .where(and(eq(carts.id, cartId), eq(carts.version, currentVersion)))
    .returning({ id: carts.id, version: carts.version })

  if (updatedRows.length === 0) {
    throw createCartError('version_conflict', 'Cart was modified by another request', 409)
  }
}

export const loadCartWithItems = async (cartId: string) => {
  const rows = await db
    .select({
      cartId: carts.id,
      cartStatus: carts.status,
      cartExpiresAt: carts.expiresAt,
      cartVersion: carts.version,
      cartItemId: cartItems.id,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      unitPriceSnapshot: cartItems.unitPriceSnapshot,
      cartItemIsSubstitutable: cartItems.isSubstitutable,
      cartItemCreatedAt: cartItems.createdAt,
      cartItemUpdatedAt: cartItems.updatedAt,
      productName: products.name,
      productSku: products.sku,
      productIsSubstitutable: products.isSubstitutable,
      productThumbUrl: products.thumbUrl,
      onHand: inventory.onHand,
      reserved: inventory.reserved,
      safetyThreshold: inventory.safetyThreshold,
    })
    .from(carts)
    .leftJoin(cartItems, eq(cartItems.cartId, carts.id))
    .leftJoin(products, eq(products.id, cartItems.productId))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(carts.id, cartId))

  const [firstRow] = rows
  if (!firstRow) {
    throw createCartError('item_not_found', 'Cart not found', 404)
  }

  const items = rows
    .filter((row) => row.cartItemId !== null)
    .map((row) => {
      const availableStock = Math.max(0, (row.onHand ?? 0) - (row.reserved ?? 0))
      const stockDisplay = getStockDisplay(availableStock, row.safetyThreshold ?? 0)

      return {
        id: row.cartItemId as string,
        productId: row.productId as string,
        productName: row.productName ?? 'Unknown Product',
        sku: row.productSku ?? `sku-${row.productId}`,
        quantity: row.quantity as number,
        unitPriceSnapshot: row.unitPriceSnapshot as number,
        isSubstitutable: row.cartItemIsSubstitutable ?? row.productIsSubstitutable ?? false,
        stockDisplay,
        availableStock,
        thumbUrl: row.productThumbUrl ?? '',
        createdAt: row.cartItemCreatedAt as Date,
        updatedAt: row.cartItemUpdatedAt as Date,
      }
    })

  const itemCount = items.length
  const totalAmount = items.reduce((sum, item) => sum + item.unitPriceSnapshot * item.quantity, 0)

  return {
    id: firstRow.cartId,
    status: firstRow.cartStatus,
    itemCount,
    totalAmount,
    expiresAt: firstRow.cartExpiresAt,
    version: firstRow.cartVersion,
    items,
  }
}

export const validateProductPurchasable = async (productId: string) => {
  const [productRow] = await db
    .select({
      id: products.id,
      isActive: products.isActive,
      categoryIsActive: categories.isActive,
      onHand: inventory.onHand,
      reserved: inventory.reserved,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(eq(products.id, productId))
    .limit(1)

  const availableStock = Math.max(0, (productRow?.onHand ?? 0) - (productRow?.reserved ?? 0))
  const isPurchasable =
    !!productRow && productRow.isActive && (productRow.categoryIsActive ?? false) && availableStock > 0

  if (!isPurchasable) {
    throw createCartError('product_unavailable', 'Product is not available for purchase', 422)
  }
}
