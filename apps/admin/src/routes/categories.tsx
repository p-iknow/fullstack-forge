import { createFileRoute } from '@tanstack/react-router'
import { AdminCategoryPage } from '~/screens/catalog/admin-category-page'

export const Route = createFileRoute('/categories')({
  component: AdminCategoryPage,
})
