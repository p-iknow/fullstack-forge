import type { RouteHandler } from '@hono/zod-openapi'
import {
  addCartItemRoute,
  clearCartRoute,
  deleteCartItemRoute,
  getCartRoute,
  updateCartItemRoute,
} from '@fullstack-forge/api-spec/routes/cart'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '~/db/client'
import { cartItems, carts, products } from '~/db/schema/index'
import { getAuthUser } from '~/routes/auth/@shared/http/middleware'
import {
  getOrCreateActiveCart,
  isCartErrorPayload,
  loadCartWithItems,
  refreshCartExpiry,
  validateProductPurchasable,
} from './@shared/cart-helpers'

const getUnauthorizedResponse = () =>
  ({ code: 'auth_session_expired', error: 'Session expired' }) as const

const toCartNotActiveError = () =>
  ({ code: 'cart_not_active', error: 'Cart is not active' }) as const

const toQuantityExceededError = () =>
  ({ code: 'quantity_exceeded', error: 'Quantity exceeds maximum of 15' }) as const

const toMaxItemsExceededError = () =>
  ({
    code: 'max_items_exceeded',
    error: 'Cart cannot contain more than 30 items',
  }) as const

const toItemNotFoundError = () =>
  ({ code: 'item_not_found', error: 'Cart item not found' }) as const

const toProductUnavailableError = () =>
  ({
    code: 'product_unavailable',
    error: 'Product is not available for purchase',
  }) as const

export const getCartHandler: RouteHandler<typeof getCartRoute> = async (c) => {
  const user = getAuthUser(c)
  if (!user) {
    return c.json(getUnauthorizedResponse(), 401)
  }

  const cart = await getOrCreateActiveCart(user.id)
  const cartResponse = await loadCartWithItems(cart.id)
  return c.json(cartResponse, 200)
}

export const addCartItemHandler: RouteHandler<typeof addCartItemRoute> = async (c) => {
  const user = getAuthUser(c)
  if (!user) {
    return c.json(getUnauthorizedResponse(), 401)
  }

  const body = c.req.valid('json')

  const cart = await getOrCreateActiveCart(user.id)

  if (cart.status !== 'active') {
    return c.json(toCartNotActiveError(), 409)
  }

  try {
    await validateProductPurchasable(body.productId)
  } catch (error) {
    if (isCartErrorPayload(error) && error.status === 422) {
      return c.json({ code: error.code, error: error.error }, 422)
    }
    throw error
  }

  const [existingItem] = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, body.productId)))
    .limit(1)

  if (existingItem) {
    const nextQuantity = existingItem.quantity + body.quantity
    if (nextQuantity > 15) {
      return c.json(toQuantityExceededError(), 400)
    }

    await db
      .update(cartItems)
      .set({
        quantity: nextQuantity,
        updatedAt: sql`now()`,
      })
      .where(eq(cartItems.id, existingItem.id))
  } else {
    const [cartItemCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id))

    if ((cartItemCountRow?.count ?? 0) >= 30) {
      return c.json(toMaxItemsExceededError(), 400)
    }

    const [product] = await db
      .select({
        id: products.id,
        price: products.price,
        isSubstitutable: products.isSubstitutable,
      })
      .from(products)
      .where(eq(products.id, body.productId))
      .limit(1)

    if (!product) {
      return c.json(toProductUnavailableError(), 422)
    }

    await db.insert(cartItems).values({
      cartId: cart.id,
      productId: body.productId,
      quantity: body.quantity,
      unitPriceSnapshot: product.price,
      isSubstitutable: product.isSubstitutable,
    })
  }

  try {
    await refreshCartExpiry(cart.id, cart.version)
  } catch (error) {
    if (isCartErrorPayload(error) && error.status === 409) {
      return c.json({ code: error.code, error: error.error }, 409)
    }
    throw error
  }

  const cartResponse = await loadCartWithItems(cart.id)
  return c.json(cartResponse, 201)
}

export const updateCartItemHandler: RouteHandler<typeof updateCartItemRoute> = async (c) => {
  const user = getAuthUser(c)
  if (!user) {
    return c.json(getUnauthorizedResponse(), 401)
  }

  const { cartItemId } = c.req.valid('param')
  const body = c.req.valid('json')

  if (body.quantity > 15) {
    return c.json(toQuantityExceededError(), 400)
  }

  const [found] = await db
    .select({
      cartItemId: cartItems.id,
      cartId: carts.id,
      cartUserId: carts.userId,
      cartStatus: carts.status,
      cartVersion: carts.version,
    })
    .from(cartItems)
    .innerJoin(carts, eq(carts.id, cartItems.cartId))
    .where(eq(cartItems.id, cartItemId))
    .limit(1)

  if (!found || found.cartUserId !== user.id) {
    return c.json(toItemNotFoundError(), 404)
  }

  if (found.cartStatus !== 'active') {
    return c.json(toCartNotActiveError(), 409)
  }

  await db
    .update(cartItems)
    .set({
      quantity: body.quantity,
      updatedAt: sql`now()`,
    })
    .where(eq(cartItems.id, cartItemId))

  try {
    await refreshCartExpiry(found.cartId, found.cartVersion)
  } catch (error) {
    if (isCartErrorPayload(error) && error.status === 409) {
      return c.json({ code: error.code, error: error.error }, 409)
    }
    throw error
  }

  try {
    const cartResponse = await loadCartWithItems(found.cartId)
    return c.json(cartResponse, 200)
  } catch (error) {
    if (isCartErrorPayload(error) && error.status === 404) {
      return c.json({ code: error.code, error: error.error }, 404)
    }
    throw error
  }
}

export const deleteCartItemHandler: RouteHandler<typeof deleteCartItemRoute> = async (c) => {
  const user = getAuthUser(c)
  if (!user) {
    return c.json(getUnauthorizedResponse(), 401)
  }

  const { cartItemId } = c.req.valid('param')

  const [found] = await db
    .select({
      cartItemId: cartItems.id,
      cartId: carts.id,
      cartUserId: carts.userId,
      cartStatus: carts.status,
      cartVersion: carts.version,
    })
    .from(cartItems)
    .innerJoin(carts, eq(carts.id, cartItems.cartId))
    .where(eq(cartItems.id, cartItemId))
    .limit(1)

  if (!found || found.cartUserId !== user.id) {
    return c.json(toItemNotFoundError(), 404)
  }

  if (found.cartStatus !== 'active') {
    return c.json(toCartNotActiveError(), 409)
  }

  await db.delete(cartItems).where(eq(cartItems.id, cartItemId))

  try {
    await refreshCartExpiry(found.cartId, found.cartVersion)
  } catch (error) {
    if (isCartErrorPayload(error) && error.status === 409) {
      return c.json({ code: error.code, error: error.error }, 409)
    }
    throw error
  }

  try {
    const cartResponse = await loadCartWithItems(found.cartId)
    return c.json(cartResponse, 200)
  } catch (error) {
    if (isCartErrorPayload(error) && error.status === 404) {
      return c.json({ code: error.code, error: error.error }, 404)
    }
    throw error
  }
}

export const clearCartHandler: RouteHandler<typeof clearCartRoute> = async (c) => {
  const user = getAuthUser(c)
  if (!user) {
    return c.json(getUnauthorizedResponse(), 401)
  }

  const [activeCart] = await db
    .select({
      id: carts.id,
      status: carts.status,
      version: carts.version,
    })
    .from(carts)
    .where(and(eq(carts.userId, user.id), eq(carts.status, 'active')))
    .limit(1)

  if (!activeCart) {
    return c.body(null, 204)
  }

  if (activeCart.status !== 'active') {
    return c.json(toCartNotActiveError(), 409)
  }

  await db.delete(cartItems).where(eq(cartItems.cartId, activeCart.id))

  try {
    await refreshCartExpiry(activeCart.id, activeCart.version)
    return c.body(null, 204)
  } catch (error) {
    if (isCartErrorPayload(error) && error.status === 409) {
      return c.json({ code: error.code, error: error.error }, 409)
    }
    throw error
  }
}
