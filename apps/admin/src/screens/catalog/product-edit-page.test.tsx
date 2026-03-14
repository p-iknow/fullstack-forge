import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { ProductEditPage } from './product-edit-page'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import type { AdminProduct, CategoryResponse } from '~/lib/api/catalog'

const mockFetch = vi.fn<typeof fetch>()

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const rootRoute = createRootRoute()
  const productEditRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/products/$id/edit',
    component: ProductEditPage,
  })

  const routeTree = rootRoute.addChildren([productEditRoute])
  const history = createMemoryHistory({ initialEntries: ['/products/test-product-id/edit'] })
  const router = createRouter({ routeTree, history, context: { queryClient } })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe(ProductEditPage.name, () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    cleanup()
  })

  test('pre-fills form with product data', async () => {
    // given
    const mockProduct: AdminProduct = {
      id: 'test-product-id',
      name: 'Test Product',
      description: 'This is a test product',
      sku: 'SKU-001',
      brand: 'Test Brand',
      weight: 500,
      price: 29900,
      isActive: true,
      stockDisplay: 'in_stock',
      categoryId: 'cat-1',
      thumbUrl: 'https://example.com/thumb.jpg',
      detailUrl: 'https://example.com/detail.jpg',
      isSubstitutable: true,
      createdAt: '2024-01-01T00:00:00Z',
    }

    const mockCategories: CategoryResponse = {
      items: [
        { id: 'cat-1', name: 'Beverages' },
        { id: 'cat-2', name: 'Snacks' },
      ],
    }

    mockFetch.mockImplementation(async (input) => {
      const url = String(input)

      if (url.includes('/api/categories')) {
        return createJsonResponse(mockCategories)
      }

      if (url.includes('/api/products/test-product-id')) {
        return createJsonResponse(mockProduct)
      }

      throw new Error('unhandled')
    })

    // when
    renderPage()

    // then
    expect(await screen.findByDisplayValue('Test Product')).toBeInTheDocument()
    expect(screen.getByDisplayValue('This is a test product')).toBeInTheDocument()
    expect(screen.getByDisplayValue('29900')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '대체 가능 상품' })).toBeChecked()
  })

  test('shows loading state while product data is pending', async () => {
    // given
    mockFetch.mockImplementation((input) => {
      const url = String(input)

      if (url.includes('/api/categories')) {
        return Promise.resolve(createJsonResponse({ items: [] }))
      }

      if (url.includes('/api/products/test-product-id')) {
        return new Promise<Response>(() => {})
      }

      return Promise.reject(new Error('unhandled'))
    })

    // when
    renderPage()

    // then
    expect(await screen.findByText('데이터를 불러오는 중...')).toBeInTheDocument()
  })

  test('shows error state when product fetch fails', async () => {
    // given
    mockFetch.mockImplementation(async (input) => {
      const url = String(input)

      if (url.includes('/api/categories')) {
        return createJsonResponse({ items: [] })
      }

      if (url.includes('/api/products/test-product-id')) {
        throw new Error('network failure')
      }

      throw new Error('unhandled')
    })

    // when
    renderPage()

    // then
    expect(await screen.findByText('상품을 불러오지 못했습니다.')).toBeInTheDocument()
  })
})
