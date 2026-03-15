import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { AuthCallbackSuccessPage } from './auth-callback-success-page'

describe('auth callback success page', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders completion message and home action', async () => {
    // given
    render(<AuthCallbackSuccessPage />)

    // when

    // then
    expect(await screen.findByText('소셜 로그인 완료')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '홈으로 이동' })).toHaveAttribute('href', '/')

    // visual regression
    await expect(page.getByRole('main')).toMatchScreenshot('auth-callback-success')
  })
})
