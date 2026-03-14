import { cleanup, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { worker } from '~/test/msw/browser'
import { renderWithRouter } from '~/test/router-utils'

import { ProductDetailPage } from './product-detail-page'

function renderPage(productId: string) {
  return renderWithRouter(<ProductDetailPage productId={productId} />)
}

describe('ProductDetailPage', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders product detail info', async () => {
    // given
    const productId = '11111111-1111-1111-1111-111111111111'
    worker.use(
      http.get('/api/products/:id', () => {
        return HttpResponse.json({
          id: productId,
          sku: 'SKU-1111',
          name: 'Apple Juice',
          brand: 'Fresh Drop',
          categoryId: 'cat-2',
          categoryName: '음료',
          price: 2900,
          weight: 330,
          isActive: true,
          stockDisplay: 'in_stock',
          isSubstitutable: true,
          thumbUrl: 'https://example.com/thumb.webp',
          detailUrl: 'https://example.com/detail.webp',
          availableStock: 4,
          canPurchase: true,
          description: 'Fresh and delicious apple juice made from premium apples.',
        })
      }),
    )

    // when
    await renderPage(productId)

    // then
    expect(await screen.findByText('Apple Juice')).toBeInTheDocument()
    expect(screen.getByText(/Fresh Drop/)).toBeInTheDocument()
    expect(screen.getByText('2,900원')).toBeInTheDocument()
    expect(screen.getByText(/330g/)).toBeInTheDocument()
    expect(
      screen.getByText('Fresh and delicious apple juice made from premium apples.'),
    ).toBeInTheDocument()
    expect(screen.getByText('구매 가능한 상품입니다.')).toBeInTheDocument()
  })

  test('shows out-of-stock message for out_of_stock stock display', async () => {
    // given
    const productId = '22222222-2222-2222-2222-222222222222'
    worker.use(
      http.get('/api/products/:id', () => {
        return HttpResponse.json({
          id: productId,
          sku: 'SKU-2222',
          name: 'Orange Juice',
          brand: 'Citrus Fresh',
          categoryId: 'cat-2',
          categoryName: '음료',
          price: 3500,
          weight: 500,
          isActive: true,
          stockDisplay: 'out_of_stock',
          isSubstitutable: false,
          thumbUrl: 'https://example.com/thumb-2.webp',
          detailUrl: 'https://example.com/detail-2.webp',
          availableStock: 0,
          canPurchase: false,
          description: 'Premium orange juice.',
        })
      }),
    )

    // when
    await renderPage(productId)

    // then
    expect(await screen.findByText('Orange Juice')).toBeInTheDocument()
    expect(screen.getByText('품절 상태로 구매가 불가합니다.')).toBeInTheDocument()
  })

  test('shows inactive message for inactive products', async () => {
    // given
    const productId = '33333333-3333-3333-3333-333333333333'
    worker.use(
      http.get('/api/products/:id', () => {
        return HttpResponse.json({
          id: productId,
          sku: 'SKU-3333',
          name: 'Grape Juice',
          brand: 'Vintage Grapes',
          categoryId: 'cat-2',
          categoryName: '음료',
          price: 4200,
          weight: 600,
          isActive: false,
          stockDisplay: 'out_of_stock',
          isSubstitutable: true,
          thumbUrl: 'https://example.com/thumb-3.webp',
          detailUrl: 'https://example.com/detail-3.webp',
          availableStock: 0,
          canPurchase: false,
          description: 'Classic grape juice.',
        })
      }),
    )

    // when
    await renderPage(productId)

    // then
    expect(await screen.findByText('Grape Juice')).toBeInTheDocument()
    expect(screen.getByText('단종 상품으로 신규 구매가 불가합니다.')).toBeInTheDocument()
  })

  test('shows loading state while product is pending', async () => {
    // given
    const productId = '44444444-4444-4444-4444-444444444444'
    worker.use(
      http.get('/api/products/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 520))
        return HttpResponse.json({
          id: productId,
          sku: 'SKU-4444',
          name: 'Mango Juice',
          brand: 'Tropical Fruits',
          categoryId: 'cat-2',
          categoryName: '음료',
          price: 3800,
          weight: 400,
          isActive: true,
          stockDisplay: 'in_stock',
          isSubstitutable: true,
          thumbUrl: 'https://example.com/thumb-4.webp',
          detailUrl: 'https://example.com/detail-4.webp',
          availableStock: 10,
          canPurchase: true,
          description: 'Refreshing mango juice.',
        })
      }),
    )

    // when
    await renderPage(productId)

    // then
    expect(screen.getByText('상품 상세를 불러오는 중...')).toBeInTheDocument()
    expect(screen.queryByText('Mango Juice')).not.toBeInTheDocument()
    expect(await screen.findByText('Mango Juice')).toBeInTheDocument()
  })
})
