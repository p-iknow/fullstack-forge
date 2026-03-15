import {
  addCartItemRoute,
  clearCartRoute,
  deleteCartItemRoute,
  getCartRoute,
  updateCartItemRoute,
} from '@fullstack-forge/api-spec/routes/cart'
import { createRouter } from '~/lib/create-app'
import { requireAuth } from '~/routes/auth/@shared/http/middleware'
import {
  addCartItemHandler,
  clearCartHandler,
  deleteCartItemHandler,
  getCartHandler,
  updateCartItemHandler,
} from './handlers'

export const cartIndex = createRouter()

cartIndex.use('*', requireAuth)
cartIndex.openapi(getCartRoute, getCartHandler)
cartIndex.openapi(addCartItemRoute, addCartItemHandler)
cartIndex.openapi(updateCartItemRoute, updateCartItemHandler)
cartIndex.openapi(deleteCartItemRoute, deleteCartItemHandler)
cartIndex.openapi(clearCartRoute, clearCartHandler)
