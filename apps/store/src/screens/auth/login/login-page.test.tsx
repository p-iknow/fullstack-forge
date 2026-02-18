import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { worker } from '~/test/msw/browser'
import { LoginPage } from './login-page'

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<object>('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
    useNavigate: () => navigateMock,
  }
})

function renderPage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <LoginPage />
    </QueryClientProvider>,
  )
}

describe('login page', () => {
  afterEach(() => {
    cleanup()
    navigateMock.mockReset()
  })

  it('shows zod validation error for invalid email', async () => {
    // given
    renderPage()

    // when
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Email' }))

    // then
    expect(await screen.findByText('Invalid email address.')).toBeInTheDocument()
  })

  it('logs in successfully and navigates to home', async () => {
    // given
    renderPage()

    // when
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'customer@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Email' }))

    // then
    expect(await screen.findByText('Signed in.')).toBeInTheDocument()
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/' })
    })
  })

  it('renders server error code when login fails', async () => {
    // given
    worker.use(
      http.post('/api/auth/login', () => {
        return HttpResponse.json(
          { code: 'auth_invalid_credentials', error: 'Invalid credentials' },
          { status: 401 },
        )
      }),
    )
    renderPage()

    // when
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'blocked@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Email' }))

    // then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid credentials (auth_invalid_credentials)',
    )
  })
})
