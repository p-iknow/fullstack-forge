import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { worker } from '~/test/msw/browser'
import { PasswordUpdatePageContent } from './password-update-page'

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<object>('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  }
})

function renderPage(onSuccessNavigate?: () => void) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <PasswordUpdatePageContent onSuccessNavigate={onSuccessNavigate} />
    </QueryClientProvider>,
  )
}

describe('password update page', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows validation error when password confirmation does not match', async () => {
    // given
    renderPage()

    // when
    fireEvent.change(screen.getByLabelText('Reset token'), { target: { value: 'token-1' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'NewPassw0rd!' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Mismatch123!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }))

    // then
    expect(await screen.findByText('Password confirmation does not match.')).toBeInTheDocument()
  })

  it('submits token and new password then runs success navigation', async () => {
    // given
    const onSuccessNavigate = vi.fn()
    renderPage(onSuccessNavigate)

    // when
    fireEvent.change(screen.getByLabelText('Reset token'), { target: { value: 'token-1' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'NewPassw0rd!' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'NewPassw0rd!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }))

    // then
    expect(await screen.findByText('Password updated. Please sign in with your new password.')).toBeInTheDocument()
    expect(onSuccessNavigate).toHaveBeenCalledTimes(1)
  })

  it('renders API error details when request fails', async () => {
    // given
    worker.use(
      http.post('/api/auth/password-reset/confirm', () => {
        return HttpResponse.json(
          {
            code: 'auth_session_expired',
            error: 'Session expired',
          },
          { status: 401 },
        )
      }),
    )
    renderPage()

    // when
    fireEvent.change(screen.getByLabelText('Reset token'), { target: { value: 'expired-token' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'NewPassw0rd!' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'NewPassw0rd!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }))

    // then
    expect(await screen.findByText('Session expired (auth_session_expired)')).toBeInTheDocument()
  })
})
