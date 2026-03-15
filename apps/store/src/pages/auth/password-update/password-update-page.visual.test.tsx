import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { http, HttpResponse } from 'msw'
import { worker } from '~/test/msw'
import { renderWithRouter } from '~/test/router-utils'
import { PasswordUpdatePageContent } from './password-update-page'

function renderPage(onSuccessNavigate?: () => void) {
  return renderWithRouter(<PasswordUpdatePageContent onSuccessNavigate={onSuccessNavigate} />, {
    initialLocation: '/password-update',
  })
}

describe('password update page', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows validation error when password confirmation does not match', async () => {
    // given
    await renderPage()

    // visual regression — initial form
    await expect(page.getByRole('main')).toMatchScreenshot('password-update-form')

    // when
    fireEvent.change(screen.getByLabelText('재설정 토큰'), { target: { value: 'token-1' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'NewPassw0rd!' } })
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), {
      target: { value: 'Mismatch123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }))

    // then
    expect(await screen.findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()

    // visual regression — validation error
    await expect(page.getByRole('main')).toMatchScreenshot('password-update-validation-error')
  })
  it('submits token and new password then runs success navigation', async () => {
    // given
    const onSuccessNavigate = vi.fn()
    await renderPage(onSuccessNavigate)

    // when
    fireEvent.change(screen.getByLabelText('재설정 토큰'), { target: { value: 'token-1' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'NewPassw0rd!' } })
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), {
      target: { value: 'NewPassw0rd!' },
    })
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }))

    // then
    expect(
      await screen.findByText('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.'),
    ).toBeInTheDocument()
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
    await renderPage()

    // when
    fireEvent.change(screen.getByLabelText('재설정 토큰'), { target: { value: 'expired-token' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'NewPassw0rd!' } })
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), {
      target: { value: 'NewPassw0rd!' },
    })
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }))

    // then
    expect(await screen.findByText('Session expired (auth_session_expired)')).toBeInTheDocument()

    // visual regression — API error
    await expect(page.getByRole('main')).toMatchScreenshot('password-update-api-error')
  })
})
