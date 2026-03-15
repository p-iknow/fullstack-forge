import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminCatalogPage } from './admin-catalog-page'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'

const mockFetch = vi.fn<typeof fetch>()

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: AdminCatalogPage,
  })

  const routeTree = rootRoute.addChildren([indexRoute])
  const history = createMemoryHistory({ initialEntries: ['/'] })
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

describe(AdminCatalogPage.name, () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    cleanup()
  })

  test('renders product list with fetched data', async () => {
    // given
    mockFetch.mockImplementation(async (input) => {
      const url = String(input)

      if (url.includes('/api/categories')) {
        return createJsonResponse({ items: [{ id: 'cat-2', name: '음료' }] })
      }

      if (url.includes('/api/products')) {
        return createJsonResponse({
          items: [
            {
              id: '111',
              name: 'Apple Juice',
              brand: 'Fresh',
              categoryName: '음료',
              isActive: true,
              stockDisplay: 'in_stock',
              price: 2900,
              availableStock: 4,
            },
          ],
          total: 1,
        })
      }

      throw new Error('unhandled')
    })

    // when
    renderPage()

    // then
    expect(await screen.findByText('Apple Juice')).toBeInTheDocument()
    expect(screen.getByText('2,900원')).toBeInTheDocument()
    expect(screen.getByRole('table')).toHaveTextContent('판매중')
  })

  test('filters products by search query on submit', async () => {
    // given
    mockFetch.mockImplementation(async (input) => {
      const url = String(input)

      if (url.includes('/api/categories')) {
        return createJsonResponse({ items: [] })
      }

      if (url.includes('/api/products')) {
        return createJsonResponse({ items: [], total: 0 })
      }

      throw new Error('unhandled')
    })

    // when
    renderPage()
    await screen.findByText('상품 관리')
    fireEvent.change(screen.getByPlaceholderText('상품명/브랜드 검색'), {
      target: { value: 'apple' },
    })
    fireEvent.click(screen.getByRole('button', { name: '조회' }))
    // then
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products?q=apple'),
        expect.any(Object),
      )
    })
  })

  test('shows loading state while products are pending', async () => {
    // given
    mockFetch.mockImplementation((input) => {
      const url = String(input)

      if (url.includes('/api/categories')) {
        return Promise.resolve(createJsonResponse({ items: [] }))
      }

      if (url.includes('/api/products')) {
        return new Promise<Response>(() => {})
      }

      return Promise.reject(new Error('unhandled'))
    })

    // when
    renderPage()
    await screen.findByText('상품 관리')
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

      if (url.includes('/api/products')) {
        throw new Error('network failure')
      }

      throw new Error('unhandled')
    })

    // when
    renderPage()
    await screen.findByText('상품 관리')
    // then
    expect(await screen.findByText('상품 데이터를 불러오지 못했습니다.')).toBeInTheDocument()
  })
})
