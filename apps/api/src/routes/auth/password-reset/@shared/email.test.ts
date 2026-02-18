import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendPasswordResetEmail } from '~/routes/auth/password-reset/@shared/email'

const originalEnv = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  AUTH_MAIL_FROM: process.env.AUTH_MAIL_FROM,
  STORE_ORIGIN: process.env.STORE_ORIGIN,
}

describe('password reset email', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = ''
    process.env.AUTH_MAIL_FROM = ''
    process.env.STORE_ORIGIN = 'http://localhost:3000'
  })

  afterEach(() => {
    process.env.RESEND_API_KEY = originalEnv.RESEND_API_KEY
    process.env.AUTH_MAIL_FROM = originalEnv.AUTH_MAIL_FROM
    process.env.STORE_ORIGIN = originalEnv.STORE_ORIGIN
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('falls back to console when resend env is not configured', async () => {
    // given
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    // when
    await sendPasswordResetEmail({
      toEmail: 'demo@example.com',
      token: 'reset-token',
    })

    // then
    expect(infoSpy).toHaveBeenCalledWith(
      '[auth] password reset mail fallback',
      expect.objectContaining({
        to: 'demo@example.com',
      }),
    )
  })

  it('calls resend api when env is configured', async () => {
    // given
    process.env.RESEND_API_KEY = 'resend-api-key'
    process.env.AUTH_MAIL_FROM = 'noreply@example.com'
    const fetchMock = vi.fn(async () => ({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    // when
    await sendPasswordResetEmail({
      toEmail: 'demo@example.com',
      token: 'reset-token',
    })

    // then
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })

  it('throws when resend returns non-2xx response', async () => {
    // given
    process.env.RESEND_API_KEY = 'resend-api-key'
    process.env.AUTH_MAIL_FROM = 'noreply@example.com'
    const fetchMock = vi.fn(async () => ({ ok: false }))
    vi.stubGlobal('fetch', fetchMock)

    // when
    const result = sendPasswordResetEmail({
      toEmail: 'demo@example.com',
      token: 'reset-token',
    })

    // then
    await expect(result).rejects.toThrow('password reset email delivery failed')
  })
})
