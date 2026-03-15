import { cleanup, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { worker } from '~/test/msw/browser'
import { renderWithRouter } from '~/test/router-utils'

import { CartPage } from './cart-page'

type CartItem = {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPriceSnapshot: number
  isSubstitutable: boolean
  stockDisplay: 'in_stock' | 'low_stock' | 'out_of_stock'
  availableStock: number
  thumbUrl: string
  createdAt: string
  updatedAt: string
}

type CartResponse = {
  id: string
  status: 'active' | 'converted' | 'expired'
  itemCount: number
  totalAmount: number
  expiresAt: string
  version: number
  items: CartItem[]
}

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

function renderPage() {
  return renderWithRouter(<CartPage />)
}

describe('CartPage', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders cart items when cart has data', async () => {
    // given
    worker.use(
      http.get('/api/cart', () => {
        return HttpResponse.json(
          createCartResponse({
            itemCount: 2,
            items: [
              createCartItem({ id: 'item-1', productName: 'Apple Juice', createdAt: '2024-01-01T00:00:00.000Z' }),
              createCartItem({ id: 'item-2', productId: 'prod-2', productName: 'Orange Juice', sku: 'SKU-2222', createdAt: '2024-01-02T00:00:00.000Z' }),
            ],
          }),
        )
      }),
      http.delete('/api/cart', () => {
        return new HttpResponse(null, { status: 204 })
      }),
    )

    // when
    await renderPage()

    // then
    expect(await screen.findByText('Apple Juice')).toBeInTheDocument()
    expect(screen.getByText('Orange Juice')).toBeInTheDocument()
    expect(screen.getByText('총 2개')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '전체 삭제' })).toBeInTheDocument()
  })

  test('shows empty state when cart is empty', async () => {
    // given
    worker.use(
      http.get('/api/cart', () => {
        return HttpResponse.json(createCartResponse({ itemCount: 0, totalAmount: 0, items: [] }))
      }),
    )

    // when
    await renderPage()

    // then
    expect(await screen.findByText('장바구니가 비어있습니다')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '상품 둘러보기' })).toHaveAttribute('href', '/')
  })

  test('shows loading skeleton while cart data is pending', async () => {
    // given
    worker.use(
      http.get('/api/cart', async () => {
        await new Promise((resolve) => setTimeout(resolve, 520))
        return HttpResponse.json(createCartResponse())
      }),
    )

    // when
    await renderPage()

    // then
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('장바구니를 불러오는 중...')).toBeInTheDocument()
    expect(screen.queryByText('Apple Juice')).not.toBeInTheDocument()
    expect(await screen.findByText('Apple Juice')).toBeInTheDocument()
  })

  test('shows error fallback when cart query fails', async () => {
    // given
    worker.use(
      http.get('/api/cart', () => {
        return HttpResponse.json(
          { code: 'cart_unavailable', error: 'Cart service unavailable' },
          { status: 500 },
        )
      }),
    )

    // when
    await renderPage()

    // then
    expect(await screen.findByText('장바구니를 불러오지 못했습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})
