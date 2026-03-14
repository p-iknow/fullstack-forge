import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminCategoryPage } from './admin-category-page'

const mockFetch = vi.fn<typeof fetch>()

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AdminCategoryPage />
    </QueryClientProvider>,
  )
}

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe(AdminCategoryPage.name, () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    cleanup()
  })

  test('renders category list and creates a new category', async () => {
    // given
    mockFetch.mockImplementation(async (input, init) => {
      const url = String(input)
      const method = init?.method || 'GET'

      if (url.includes('/api/admin/categories') && method === 'GET') {
        return createJsonResponse({
          items: [
            {
              id: 'cat-1',
              name: '음료',
              slug: 'beverage',
              displayOrder: 1,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
        })
      }

      if (url.includes('/api/admin/categories') && method === 'POST') {
        return createJsonResponse({
          id: 'cat-2',
          name: '스낵',
          slug: 'snack',
          displayOrder: 2,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
        })
      }

      throw new Error('unhandled')
    })

    // when
    renderPage()

    // then
    expect(await screen.findByText('음료')).toBeInTheDocument()
    expect(screen.getByText('beverage')).toBeInTheDocument()

    // Create new category
    fireEvent.click(screen.getByRole('button', { name: '카테고리 추가' }))

    const nameInputs = screen.getAllByPlaceholderText('이름')
    const slugInputs = screen.getAllByPlaceholderText('슬러그')

    fireEvent.change(nameInputs[0], { target: { value: '스낵' } })
    fireEvent.change(slugInputs[0], { target: { value: 'snack' } })

    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/categories'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: '스낵',
            slug: 'snack',
            displayOrder: 0,
            isActive: true,
          }),
        }),
      )
    })
  })
})
