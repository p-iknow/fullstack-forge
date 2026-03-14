import { createRouter } from '~/lib/create-app'
import {
  adminDashboardRoute,
  adminRedriveRoute,
  createAdminCategoryRoute,
  createAdminProductRoute,
  deleteAdminCategoryRoute,
  deleteAdminProductRoute,
  getAdminCategoriesRoute,
  updateAdminProductActiveRoute,
  updateAdminCategoryRoute,
  updateAdminProductRoute,
  uploadAdminProductImagesRoute,
} from '@fullstack-forge/api-spec/routes/admin'
import { getAuthUser, requireAuth } from '~/routes/auth/@shared/http/middleware'
import {
  createAdminCategoryHandler,
  deleteAdminCategoryHandler,
  getAdminCategoriesHandler,
  updateAdminCategoryHandler,
} from './categories/handlers'
import {
  createAdminProductHandler,
  deleteAdminProductHandler,
  updateAdminProductActiveHandler,
  updateAdminProductHandler,
  uploadAdminProductImagesHandler,
} from './products/handlers'

export const adminIndex = createRouter()

adminIndex.use('*', requireAuth)

const dashboardHandler = async (
  c: Parameters<typeof adminIndex.openapi>[1] extends (arg: infer T, ...rest: never[]) => unknown
    ? T
    : never,
) => {
  const user = getAuthUser(c)

  if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
    return c.json({ code: 'auth_forbidden', error: 'Forbidden' }, 403)
  }

  return c.json(
    {
      ok: true,
      role: user?.role ?? null,
    },
    200,
  )
}

const redriveHandler = async (
  c: Parameters<typeof adminIndex.openapi>[1] extends (arg: infer T, ...rest: never[]) => unknown
    ? T
    : never,
) => {
  const user = getAuthUser(c)

  if (!user || user.role !== 'admin') {
    return c.json({ code: 'auth_forbidden', error: 'Forbidden' }, 403)
  }

  return c.json(
    {
      ok: true,
      action: 'redrive_started' as const,
      requestedBy: user?.id ?? null,
    },
    200,
  )
}

adminIndex.openapi(adminDashboardRoute, dashboardHandler)
adminIndex.openapi(adminRedriveRoute, redriveHandler)
adminIndex.openapi(getAdminCategoriesRoute, getAdminCategoriesHandler)
adminIndex.openapi(createAdminCategoryRoute, createAdminCategoryHandler)
adminIndex.openapi(updateAdminCategoryRoute, updateAdminCategoryHandler)
adminIndex.openapi(deleteAdminCategoryRoute, deleteAdminCategoryHandler)
adminIndex.openapi(createAdminProductRoute, createAdminProductHandler)
adminIndex.openapi(updateAdminProductRoute, updateAdminProductHandler)
adminIndex.openapi(updateAdminProductActiveRoute, updateAdminProductActiveHandler)
adminIndex.openapi(deleteAdminProductRoute, deleteAdminProductHandler)
adminIndex.openapi(uploadAdminProductImagesRoute, uploadAdminProductImagesHandler)
