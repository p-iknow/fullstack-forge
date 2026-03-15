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
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: '이메일로 로그인' }))

    // then
    expect(await screen.findByText('유효하지 않은 이메일 주소입니다.')).toBeInTheDocument()

    // visual regression — validation error
    await expect(page.getByRole('main')).toMatchScreenshot('login-validation-error')
  })
  it('logs in successfully and navigates to home', async () => {
    // given
    const { router } = await renderPage()

    // when
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'customer@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: '이메일로 로그인' }))

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
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'blocked@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: '이메일로 로그인' }))

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
    const googleLink = screen.getByRole('link', { name: 'Google로 계속하기' })
    const kakaoLink = screen.getByRole('link', { name: 'Kakao로 계속하기' })

    // then
    expect(googleLink).toHaveAttribute('href', '/api/auth/oauth/google/start?redirect=/')
    expect(kakaoLink).toHaveAttribute('href', '/api/auth/oauth/kakao/start?redirect=/')
  })
})
