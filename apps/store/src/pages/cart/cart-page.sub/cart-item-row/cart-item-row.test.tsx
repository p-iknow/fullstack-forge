import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { worker } from '~/test/msw/browser'
import { renderWithRouter } from '~/test/router-utils'

import type { CartItem } from '~/@shared/api/cart'
import { CartItemRow } from './cart-item-row'

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

function renderRow(item: CartItem) {
  return renderWithRouter(<CartItemRow item={item} />)
}

describe('CartItemRow', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders item name, sku, and price', async () => {
    // given
    const item = createCartItem({ productName: 'Apple Juice', sku: 'SKU-1111', unitPriceSnapshot: 2900 })

    // when
    await renderRow(item)

    // then
    expect(screen.getByText('Apple Juice')).toBeInTheDocument()
    expect(screen.getByText('SKU-1111')).toBeInTheDocument()
    expect(screen.getByText('2,900원')).toBeInTheDocument()
  })

  test('shows 품절 badge for out_of_stock items', async () => {
    // given
    const item = createCartItem({ stockDisplay: 'out_of_stock' })

    // when
    await renderRow(item)

    // then
    expect(screen.getByText('품절')).toBeInTheDocument()
  })

  test('shows 재고 부족 badge for low_stock items', async () => {
    // given
    const item = createCartItem({ stockDisplay: 'low_stock' })

    // when
    await renderRow(item)

    // then
    expect(screen.getByText('재고 부족')).toBeInTheDocument()
  })

  test('updates displayed quantity when increase and decrease buttons are clicked', async () => {
    // given
    const item = createCartItem({ id: 'item-qty', quantity: 2 })
    worker.use(
      http.patch('/api/cart/items/:itemId', async () => {
        await new Promise((resolve) => setTimeout(resolve, 520))
        return HttpResponse.json({ ok: true })
      }),
      http.delete('/api/cart/items/:itemId', () => {
        return HttpResponse.json({ ok: true })
      }),
    )

    // when
    await renderRow(item)
    fireEvent.click(screen.getByRole('button', { name: '수량 증가' }))

    // then
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    // when
    fireEvent.click(screen.getByRole('button', { name: '수량 감소' }))

    // then
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  test('renders delete button with aria-label and calls delete endpoint', async () => {
    // given
    const item = createCartItem({ id: 'item-delete', productName: 'Delete Target' })
    let deletedItemId: string | null = null

    worker.use(
      http.patch('/api/cart/items/:itemId', () => {
        return HttpResponse.json({ ok: true })
      }),
      http.delete('/api/cart/items/:itemId', ({ params }) => {
        deletedItemId = String(params.itemId)
        return HttpResponse.json({ ok: true })
      }),
    )

    // when
    await renderRow(item)
    fireEvent.click(screen.getByRole('button', { name: 'Delete Target 삭제' }))

    // then
    await waitFor(() => {
      expect(deletedItemId).toBe('item-delete')
    })
  })
})
