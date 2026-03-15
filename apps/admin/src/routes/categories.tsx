import { createFileRoute } from '@tanstack/react-router'
import { AdminCategoryPage } from '~/pages/catalog/admin-category-page'

export const Route = createFileRoute('/categories')({
  component: AdminCategoryPage,
})
