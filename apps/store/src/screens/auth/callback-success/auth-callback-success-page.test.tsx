import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
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
    expect(await screen.findByText('OAuth callback complete')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Home' })).toHaveAttribute('href', '/')
  })
})
