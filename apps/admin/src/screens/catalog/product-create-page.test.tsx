import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { ProductCreatePage } from './product-create-page'
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
    component: () => <div>Index</div>,
  })
  const createRouteNode = createRoute({
    getParentRoute: () => rootRoute,
    path: '/products/new',
    component: ProductCreatePage,
  })

  const routeTree = rootRoute.addChildren([indexRoute, createRouteNode])
  const history = createMemoryHistory({ initialEntries: ['/products/new'] })
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

describe(ProductCreatePage.name, () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    cleanup()
  })

  test('renders form and submits successfully', async () => {
    // given
    mockFetch.mockImplementation(async (input, init) => {
      const url = String(input)
      const method = init?.method || 'GET'

      if (url.includes('/api/categories') && method === 'GET') {
        return createJsonResponse({
          items: [{ id: '123e4567-e89b-12d3-a456-426614174000', name: '음료' }],
        })
      }

      if (url.includes('/api/admin/products') && method === 'POST') {
        return createJsonResponse({ id: 'new-prod', name: 'New Product' })
      }

      throw new Error('unhandled')
    })

    // when
    renderPage()

    // then
    expect(await screen.findByText('상품 등록')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('상품명'), { target: { value: 'New Product' } })
    fireEvent.change(screen.getByLabelText('상품 설명'), { target: { value: 'Description' } })
    fireEvent.change(screen.getByLabelText('가격'), { target: { value: '1000' } })

    // Wait for categories to load
    await screen.findByText('음료')
    fireEvent.change(screen.getByLabelText('카테고리'), {
      target: { value: '123e4567-e89b-12d3-a456-426614174000' },
    })
    fireEvent.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => {
      if (screen.queryByText('카테고리를 선택해주세요')) {
        throw new Error('Validation error: 카테고리를 선택해주세요')
      }
      if (screen.queryByText('가격은 0보다 커야 합니다')) {
        throw new Error('Validation error: 가격은 0보다 커야 합니다')
      }
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/products'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'New Product',
            description: 'Description',
            price: 1000,
            categoryId: '123e4567-e89b-12d3-a456-426614174000',
            isSubstitutable: false,
          }),
        }),
      )
    })
  })
})
