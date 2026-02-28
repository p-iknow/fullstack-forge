import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { http, HttpResponse } from 'msw'
import { worker } from '~/test/msw/browser'
import { renderWithRouter } from '~/test/router-utils'
import { SignupPage } from './signup-page'

function renderPage() {
  return renderWithRouter(<SignupPage />, { initialLocation: '/signup' })
}

describe('signup page', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows zod validation error for short password', async () => {
    // given
    await renderPage()

    // visual regression — initial form
    await expect(page.getByRole('main')).toMatchScreenshot('signup-form')

    // when
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign up with Email' }))

    // then
    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument()

    // visual regression — validation error
    await expect(page.getByRole('main')).toMatchScreenshot('signup-validation-error')

  })
  it('signs up successfully and navigates to home', async () => {
    // given
    const { router } = await renderPage()

    // when
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign up with Email' }))

    // then
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
    })
  })

  it('renders conflict code when signup fails', async () => {
    // given
    worker.use(
      http.post('/api/auth/signup', () => {
        return HttpResponse.json(
          { code: 'auth_email_conflict', error: 'Email already exists' },
          { status: 409 },
        )
      }),
    )
    await renderPage()

    // when
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'taken@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign up with Email' }))

    // then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email already exists (auth_email_conflict)',
    )

    // visual regression — server error
    await expect(page.getByRole('main')).toMatchScreenshot('signup-server-error')
  })
})
