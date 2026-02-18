import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { worker } from '~/test/msw/browser'
import { HomePage } from './home-page'

function renderPage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  )
}

describe('home page', () => {
  beforeEach(() => {
    document.cookie = 'qc_auth_hint=; Max-Age=0; path=/'
  })

  afterEach(() => {
    cleanup()
  })

  it('shows login CTA when auth hint is not present', async () => {
    // given
    renderPage()

    // when

    // then
    expect(await screen.findByText('Log in')).toBeInTheDocument()
    expect(screen.getByText('Sign up')).toBeInTheDocument()
  })

  it('shows current user and allows logout when me query succeeds', async () => {
    // given
    const expiresAt = Math.floor(Date.now() / 1000) + 3600
    document.cookie = `qc_auth_hint=${expiresAt}; path=/`
    let meCallCount = 0
    worker.use(
      http.get('/api/auth/me', () => {
        meCallCount += 1
        if (meCallCount === 1) {
          return HttpResponse.json(
            {
              user: {
                id: 'user-1',
                email: 'customer@example.com',
                name: 'Customer',
                role: 'customer',
                status: 'active',
              },
            },
            { status: 200 },
          )
        }

        return HttpResponse.json(
          { code: 'auth_session_expired', error: 'Session expired' },
          { status: 401 },
        )
      }),
    )
    renderPage()

    // when
    expect(await screen.findByText('customer@example.com')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))

    // then
    expect(await screen.findByText('Log in')).toBeInTheDocument()
  })
})
