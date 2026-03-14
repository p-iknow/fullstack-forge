export { adminDashboardRoute } from './dashboard/route'
export { adminRedriveRoute } from './redrive/route'
export {
  adminCategoryIdParamsSchema,
  createAdminCategoryRoute,
  deleteAdminCategoryRoute,
  getAdminCategoriesRoute,
  updateAdminCategoryRoute,
} from './categories/route'
export {
  adminProductIdParamsSchema,
  createAdminProductRoute,
  deleteAdminProductRoute,
  updateAdminProductActiveRoute,
  updateAdminProductRoute,
  uploadAdminProductImagesRoute,
} from './products/route'
