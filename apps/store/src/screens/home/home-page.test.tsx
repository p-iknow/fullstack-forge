import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { http, HttpResponse } from 'msw'
import { worker } from '~/test/msw/browser'
import { renderWithRouter } from '~/test/router-utils'

import { HomePage } from './home-page'

function renderPage() {
  return renderWithRouter(<HomePage />)
}

describe('home page', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders catalog products', async () => {
    // given
    worker.use(
      http.get('/api/categories', () => {
        return HttpResponse.json({
          items: [{ id: 'cat-2', name: '음료', slug: 'beverage', displayOrder: 2, isActive: true }],
        })
      }),
      http.get('/api/products', () => {
        return HttpResponse.json({
          items: [
            {
              id: '11111111-1111-1111-1111-111111111111',
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
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        })
      }),
    )

    // when
    await renderPage()

    // then
    expect(await screen.findByText('Apple Juice')).toBeInTheDocument()
    expect(screen.getByText('2,900원')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Apple Juice/ })).toHaveAttribute(
      'href',
      '/products/11111111-1111-1111-1111-111111111111',
    )
    expect(screen.queryByText('상세 보기')).not.toBeInTheDocument()

    // visual regression
    await expect(page.getByRole('main')).toMatchScreenshot('catalog-products')
  })

  it('shows skeleton view while products are loading', async () => {
    // given
    worker.use(
      http.get('/api/categories', () => {
        return HttpResponse.json({ items: [] })
      }),
      http.get('/api/products', async () => {
        await new Promise((resolve) => setTimeout(resolve, 520))
        return HttpResponse.json({
          items: [
            {
              id: '11111111-1111-1111-1111-111111111111',
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
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        })
      }),
    )

    // when
    await renderPage()

    // then
    expect(await screen.findByTestId('catalog-skeleton-grid')).toBeInTheDocument()
    expect(screen.queryByText('Apple Juice')).not.toBeInTheDocument()
    expect(await screen.findByText('Apple Juice')).toBeInTheDocument()
  })

  it('does not flash skeleton for quick product responses', async () => {
    // given
    worker.use(
      http.get('/api/categories', () => {
        return HttpResponse.json({ items: [] })
      }),
      http.get('/api/products', async () => {
        await new Promise((resolve) => setTimeout(resolve, 40))
        return HttpResponse.json({
          items: [
            {
              id: '11111111-1111-1111-1111-111111111111',
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
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        })
      }),
    )

    // when
    await renderPage()

    // then
    expect(await screen.findByText('Apple Juice')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByTestId('catalog-skeleton-grid')).toBeNull()
    })
  })

  it('searches products by keyword', async () => {
    // given
    worker.use(
      http.get('/api/categories', () => {
        return HttpResponse.json({ items: [] })
      }),
      http.get('/api/products', () => {
        return HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 })
      }),
      http.get('/api/products/search', ({ request }) => {
        const url = new URL(request.url)
        const query = url.searchParams.get('q')
        return HttpResponse.json({
          items:
            query === 'apple'
              ? [
                  {
                    id: '11111111-1111-1111-1111-111111111111',
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
                  },
                ]
              : [],
          page: 1,
          pageSize: 20,
          total: query === 'apple' ? 1 : 0,
        })
      }),
    )

    // when
    await renderPage()
    fireEvent.change(screen.getByPlaceholderText('상품명, 브랜드, SKU로 검색'), {
      target: { value: 'apple' },
    })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    // then
    expect(await screen.findByText('Apple Juice')).toBeInTheDocument()
  })

  it('shows fallback screen when no products match current conditions', async () => {
    // given
    worker.use(
      http.get('/api/categories', () => {
        return HttpResponse.json({ items: [] })
      }),
      http.get('/api/products', () => {
        return HttpResponse.json({
          items: [
            {
              id: '11111111-1111-1111-1111-111111111111',
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
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        })
      }),
      http.get('/api/products/search', () => {
        return HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 })
      }),
    )

    // when
    await renderPage()
    fireEvent.change(screen.getByPlaceholderText('상품명, 브랜드, SKU로 검색'), {
      target: { value: 'not-found' },
    })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    // then
    expect(await screen.findByText('조건에 맞는 상품이 없습니다')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '초기화' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Apple Juice')).not.toBeInTheDocument()
  })

  it('moves between pages with pagination controls', async () => {
    // given
    worker.use(
      http.get('/api/categories', () => {
        return HttpResponse.json({ items: [] })
      }),
      http.get('/api/products', ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? '1')

        if (page === 2) {
          return HttpResponse.json({
            items: [
              {
                id: '22222222-2222-2222-2222-222222222222',
                sku: 'SKU-2222',
                name: 'Laundry Wipe',
                brand: 'Spark Home',
                categoryId: 'cat-4',
                categoryName: '생활용품',
                price: 4900,
                weight: 520,
                isActive: true,
                stockDisplay: 'in_stock',
                isSubstitutable: true,
                thumbUrl: 'https://example.com/thumb-2.webp',
                detailUrl: 'https://example.com/detail-2.webp',
                availableStock: 7,
                canPurchase: true,
              },
            ],
            page: 2,
            pageSize: 20,
            total: 21,
          })
        }

        return HttpResponse.json({
          items: [
            {
              id: '11111111-1111-1111-1111-111111111111',
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
            },
          ],
          page: 1,
          pageSize: 20,
          total: 21,
        })
      }),
    )

    // when
    await renderPage()
    expect(await screen.findByText('Apple Juice')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '2' }))

    // then
    expect(await screen.findByText('Laundry Wipe')).toBeInTheDocument()
    expect(screen.queryByText('Apple Juice')).not.toBeInTheDocument()
  })

  it('jumps to first and last page with dedicated buttons', async () => {
    // given
    worker.use(
      http.get('/api/categories', () => {
        return HttpResponse.json({ items: [] })
      }),
      http.get('/api/products', ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? '1')

        if (page === 3) {
          return HttpResponse.json({
            items: [
              {
                id: '33333333-3333-3333-3333-333333333333',
                sku: 'SKU-3333',
                name: 'Final Page Product',
                brand: 'Spark Home',
                categoryId: 'cat-4',
                categoryName: '생활용품',
                price: 5900,
                weight: 610,
                isActive: true,
                stockDisplay: 'in_stock',
                isSubstitutable: true,
                thumbUrl: 'https://example.com/thumb-3.webp',
                detailUrl: 'https://example.com/detail-3.webp',
                availableStock: 2,
                canPurchase: true,
              },
            ],
            page: 3,
            pageSize: 20,
            total: 60,
          })
        }

        return HttpResponse.json({
          items: [
            {
              id: '11111111-1111-1111-1111-111111111111',
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
            },
          ],
          page: 1,
          pageSize: 20,
          total: 60,
        })
      }),
    )

    // when
    await renderPage()
    expect(await screen.findByText('Apple Juice')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '마지막' }))

    // then
    expect(await screen.findByText('Final Page Product')).toBeInTheDocument()
    expect(screen.queryByText('Apple Juice')).not.toBeInTheDocument()

    // when
    fireEvent.click(screen.getByRole('button', { name: '처음' }))

    // then
    expect(await screen.findByText('Apple Juice')).toBeInTheDocument()
    expect(screen.queryByText('Final Page Product')).not.toBeInTheDocument()
  })
})
