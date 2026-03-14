import { ApiClientError, fetchWithRefresh } from '~/lib/api/core'

export type CartItemStockDisplay = 'in_stock' | 'low_stock' | 'out_of_stock'

export type CartItem = {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPriceSnapshot: number
  isSubstitutable: boolean
  stockDisplay: CartItemStockDisplay
  availableStock: number
  thumbUrl: string
  createdAt: string
  updatedAt: string
}

export type CartResponse = {
  id: string
  status: 'active' | 'converted' | 'expired'
  itemCount: number
  totalAmount: number
  expiresAt: string
  version: number
  items: CartItem[]
}

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetchWithRefresh(url, {
    credentials: 'include',
    ...init,
  })

  const payload = (await response.json().catch(() => null)) as {
    code?: string
    error?: string
  } | null

  if (!response.ok) {
    throw new ApiClientError(
      {
        code: payload?.code,
        error: payload?.error ?? `Request failed (${response.status})`,
      },
      'Cart request failed',
    )
  }

  if (!payload) {
    throw new ApiClientError({ error: 'Empty response' }, 'Cart request failed')
  }

  return payload as T
}

const requestVoid = async (url: string, init?: RequestInit): Promise<void> => {
  const response = await fetchWithRefresh(url, {
    credentials: 'include',
    ...init,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      code?: string
      error?: string
    } | null
    throw new ApiClientError(
      {
        code: payload?.code,
        error: payload?.error ?? `Request failed (${response.status})`,
      },
      'Cart request failed',
    )
  }
}

export const getCart = async (): Promise<CartResponse> => {
  return requestJson<CartResponse>('/api/cart')
}

export const addCartItem = async (
  productId: string,
  quantity: number,
): Promise<CartResponse> => {
  return requestJson<CartResponse>('/api/cart/items', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ productId, quantity }),
  })
}

export const updateCartItem = async (
  cartItemId: string,
  quantity: number,
): Promise<CartResponse> => {
  return requestJson<CartResponse>(`/api/cart/items/${cartItemId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ quantity }),
  })
}

export const deleteCartItem = async (cartItemId: string): Promise<CartResponse> => {
  return requestJson<CartResponse>(`/api/cart/items/${cartItemId}`, {
    method: 'DELETE',
  })
}

export const clearCart = async (): Promise<void> => {
  return requestVoid('/api/cart', {
    method: 'DELETE',
  })
}
