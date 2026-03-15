import { cleanup, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import type { CartItem, CartResponse } from '~/lib/api/cart'
import { renderWithRouter } from '~/test/router-utils'

import { CartSummary } from './cart-summary'

const createCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'item-1',
  productId: 'prod-1',
  productName: 'Apple Juice',
  sku: 'SKU-1111',
  quantity: 2,
  unitPriceSnapshot: 2900,
  isSubstitutable: true,
  stockDisplay: 'in_stock',
  availableStock: 10,
  thumbUrl: 'https://example.com/thumb.webp',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

const createCartResponse = (overrides: Partial<CartResponse> = {}): CartResponse => ({
  id: 'cart-1',
  status: 'active',
  itemCount: 1,
  totalAmount: 5800,
  expiresAt: '2024-02-01T00:00:00.000Z',
  version: 1,
  items: [createCartItem()],
  ...overrides,
})

function renderSummary(cart: CartResponse) {
  return renderWithRouter(<CartSummary cart={cart} />)
}

describe('CartSummary', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders total amount formatted', async () => {
    // given
    const cart = createCartResponse({ totalAmount: 123400 })

    // when
    await renderSummary(cart)

    // then
    expect(screen.getByText('123,400원')).toBeInTheDocument()
  })

  test('shows expiry date', async () => {
    // given
    const expiresAt = '2024-02-01T00:00:00.000Z'
    const cart = createCartResponse({ expiresAt })
    const expectedExpiry = new Date(expiresAt).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    // when
    await renderSummary(cart)

    // then
    expect(screen.getByText(`만료 예정: ${expectedExpiry}`)).toBeInTheDocument()
  })

  test('enables 주문하기 button when there are no out_of_stock items', async () => {
    // given
    const cart = createCartResponse({
      items: [createCartItem({ stockDisplay: 'in_stock' }), createCartItem({ id: 'item-2', stockDisplay: 'low_stock' })],
    })

    // when
    await renderSummary(cart)

    // then
    expect(screen.getByRole('button', { name: '주문하기' })).toBeEnabled()
    expect(screen.queryByText('품절 상품을 제거해주세요.')).not.toBeInTheDocument()
  })

  test('disables 주문하기 button and shows message when out_of_stock item exists', async () => {
    // given
    const cart = createCartResponse({
      items: [createCartItem({ stockDisplay: 'out_of_stock' })],
    })

    // when
    await renderSummary(cart)

    // then
    expect(screen.getByRole('button', { name: '주문하기' })).toBeDisabled()
    expect(screen.getByText('품절 상품을 제거해주세요.')).toBeInTheDocument()
  })
})
