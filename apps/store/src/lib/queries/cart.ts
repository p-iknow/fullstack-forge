import { mutationOptions, queryOptions } from '@tanstack/react-query'
import {
  addCartItem,
  clearCart,
  deleteCartItem,
  getCart,
  updateCartItem,
} from '~/lib/api/cart'

export const cartQueryKeys = {
  cart: ['cart'] as const,
  addItem: ['cart', 'addItem'] as const,
  updateItem: ['cart', 'updateItem'] as const,
  deleteItem: ['cart', 'deleteItem'] as const,
  clearCart: ['cart', 'clear'] as const,
}

export const cartQueryOptions = () =>
  queryOptions({
    queryKey: cartQueryKeys.cart,
    queryFn: getCart,
    staleTime: 10_000,
  })

export const addCartItemMutationOptions = () =>
  mutationOptions({
    mutationKey: cartQueryKeys.addItem,
    mutationFn: async (input: { productId: string; quantity: number }) => {
      return addCartItem(input.productId, input.quantity)
    },
  })

export const updateCartItemMutationOptions = () =>
  mutationOptions({
    mutationKey: cartQueryKeys.updateItem,
    mutationFn: async (input: { cartItemId: string; quantity: number }) => {
      return updateCartItem(input.cartItemId, input.quantity)
    },
  })

export const deleteCartItemMutationOptions = () =>
  mutationOptions({
    mutationKey: cartQueryKeys.deleteItem,
    mutationFn: async (cartItemId: string) => {
      return deleteCartItem(cartItemId)
    },
  })

export const clearCartMutationOptions = () =>
  mutationOptions({
    mutationKey: cartQueryKeys.clearCart,
    mutationFn: clearCart,
  })
