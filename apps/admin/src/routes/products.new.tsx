import { createFileRoute } from '@tanstack/react-router'
import { ProductCreatePage } from '~/screens/catalog/product-create-page'

export const Route = createFileRoute('/products/new')({
  component: ProductCreatePage,
})
