import { createFileRoute } from '@tanstack/react-router'
import { AdminCatalogPage } from '~/screens/catalog/admin-catalog-page'

export const Route = createFileRoute('/')({
  component: AdminCatalogPage,
})
