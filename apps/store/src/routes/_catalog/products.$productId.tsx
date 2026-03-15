import { createFileRoute } from '@tanstack/react-router'
import { ProductDetailPage } from '~/pages/catalog/product-detail-page'

export const Route = createFileRoute('/_catalog/products/$productId')({
  component: ProductDetailRoute,
})

function ProductDetailRoute() {
  const { productId } = Route.useParams()
  return <ProductDetailPage productId={productId} />
}
