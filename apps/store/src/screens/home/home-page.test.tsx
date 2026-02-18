import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { delay, http, HttpResponse } from 'msw'
import { authQueryKeys, type MeResponse } from '~/lib/queries/auth'
import { worker } from '~/test/msw/browser'
import { HomePage } from './home-page'

function renderPage(initialMeData?: MeResponse | null) {
  const queryClient = new QueryClient()
  if (initialMeData !== undefined) {
    queryClient.setQueryData(authQueryKeys.me, initialMeData)
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  )
}

describe('home page', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows login CTA when session is unauthenticated', async () => {
    // given
    renderPage(null)

    // when

    // then
    expect(await screen.findByText('Log in')).toBeInTheDocument()
  })

  it('shows placeholder while session check is pending', async () => {
    // given
    worker.use(
      http.get('/api/auth/me', async () => {
        await delay(120)
        return HttpResponse.json(
          { code: 'auth_session_expired', error: 'Session expired' },
          { status: 401 },
        )
      }),
    )

    // when
    renderPage()

    // then
    expect(screen.getByLabelText('Checking session')).toBeInTheDocument()
    expect(await screen.findByText('Log in')).toBeInTheDocument()
  })

  it('shows logout when authenticated and switches to login after logout', async () => {
    // given
    let loggedOut = false
    worker.use(
      http.get('/api/auth/me', () => {
        if (!loggedOut) {
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
      http.post('/api/auth/logout', () => {
        loggedOut = true
        return HttpResponse.json({ ok: true as const }, { status: 200 })
      }),
    )
    renderPage({
      user: {
        id: 'user-1',
        email: 'customer@example.com',
        name: 'Customer',
        role: 'customer',
        status: 'active',
      },
    })

    // when
    const logoutButton = await screen.findByRole('button', { name: 'Log out' })
    expect(logoutButton).toBeInTheDocument()
    fireEvent.click(logoutButton)

    // then
    expect(await screen.findByText('Log in')).toBeInTheDocument()
  })
})
