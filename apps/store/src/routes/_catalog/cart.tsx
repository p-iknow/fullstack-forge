import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '~/screens/cart/cart-page'

export const Route = createFileRoute('/_catalog/cart')({
  component: CartPage,
})
