import { createFileRoute } from '@tanstack/react-router'
import { ProductCreatePage } from '~/pages/catalog/product-create-page'

export const Route = createFileRoute('/products/new')({
  component: ProductCreatePage,
})
