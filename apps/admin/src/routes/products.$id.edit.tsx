import { createFileRoute } from '@tanstack/react-router'
import { ProductEditPage } from '~/pages/catalog/product-edit-page'

export const Route = createFileRoute('/products/$id/edit')({
  component: ProductEditPage,
})
