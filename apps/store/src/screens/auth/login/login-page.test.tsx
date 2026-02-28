import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { http, HttpResponse } from 'msw'
import { worker } from '~/test/msw/browser'
import { renderWithRouter } from '~/test/router-utils'
import { LoginPage } from './login-page'

function renderPage() {
  return renderWithRouter(<LoginPage />, { initialLocation: '/login' })
}

describe('login page', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows zod validation error for invalid email', async () => {
    // given
    await renderPage()

    // visual regression — initial form
    await expect(page.getByRole('main')).toMatchScreenshot('login-form')

    // when
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Email' }))

    // then
    expect(await screen.findByText('Invalid email address.')).toBeInTheDocument()

    // visual regression — validation error
    await expect(page.getByRole('main')).toMatchScreenshot('login-validation-error')

  })
  it('logs in successfully and navigates to home', async () => {
    // given
    const { router } = await renderPage()

    // when
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'customer@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Email' }))

    // then — with real router, navigate({ to: '/' }) triggers route change
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
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
    await renderPage()

    // when
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'blocked@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Email' }))

    // then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid credentials (auth_invalid_credentials)',
    )

    // visual regression — server error
    await expect(page.getByRole('main')).toMatchScreenshot('login-server-error')
  })

  it('renders OAuth links with correct start URLs', async () => {
    // given
    await renderPage()

    // when
    const googleLink = screen.getByRole('link', { name: 'Continue with Google' })
    const kakaoLink = screen.getByRole('link', { name: 'Continue with Kakao' })

    // then
    expect(googleLink).toHaveAttribute(
      'href',
      '/api/auth/oauth/google/start?redirect=/auth/callback/success',
    )
    expect(kakaoLink).toHaveAttribute(
      'href',
      '/api/auth/oauth/kakao/start?redirect=/auth/callback/success',
    )
  })
})
