import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '~/pages/cart/cart-page'

export const Route = createFileRoute('/_catalog/cart')({
  component: CartPage,
})
