import { createRouter } from '~/lib/create-app'
import {
  getCategoriesRoute,
  getProductByIdRoute,
  getProductsRoute,
  searchProductsRoute,
} from '@fullstack-forge/api-spec/routes/catalog'
import {
  getCategoriesHandler,
  getProductByIdHandler,
  getProductsHandler,
  searchProductsHandler,
} from './handlers'

export const catalogIndex = createRouter()

catalogIndex.openapi(getProductsRoute, getProductsHandler)
catalogIndex.openapi(searchProductsRoute, searchProductsHandler)
catalogIndex.openapi(getProductByIdRoute, getProductByIdHandler)
catalogIndex.openapi(getCategoriesRoute, getCategoriesHandler)
