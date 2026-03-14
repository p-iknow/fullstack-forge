import { createRouter } from '~/lib/create-app'
import {
  createAdminCategoryRoute,
  deleteAdminCategoryRoute,
  getAdminCategoriesRoute,
  updateAdminCategoryRoute,
} from '@fullstack-forge/api-spec/routes/admin'
import {
  createAdminCategoryHandler,
  deleteAdminCategoryHandler,
  getAdminCategoriesHandler,
  updateAdminCategoryHandler,
} from './handlers'

export const adminCategoriesRouter = createRouter()

adminCategoriesRouter.openapi(getAdminCategoriesRoute, getAdminCategoriesHandler)
adminCategoriesRouter.openapi(createAdminCategoryRoute, createAdminCategoryHandler)
adminCategoriesRouter.openapi(updateAdminCategoryRoute, updateAdminCategoryHandler)
adminCategoriesRouter.openapi(deleteAdminCategoryRoute, deleteAdminCategoryHandler)
