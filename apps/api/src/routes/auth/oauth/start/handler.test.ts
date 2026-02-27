import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authIndex } from '~/routes/auth/index'

const { rateLimitState, createOAuthStateMock, logAuditEventMock } = vi.hoisted(() => ({
  rateLimitState: { limited: false },
  createOAuthStateMock: vi.fn(
    async ({ provider, nonce, redirectPath }: Record<string, string>) => ({
      state: 'oauth-state',
      provider,
      nonce,
      redirectPath,
    }),
  ),
  logAuditEventMock: vi.fn(async () => {}),
}))

vi.mock('~/routes/auth/oauth/@shared/state', () => ({
  createOAuthState: createOAuthStateMock,
}))

vi.mock('~/routes/auth/oauth/@shared/providers', () => ({
  isOAuthProvider: (value: string) => value === 'google' || value === 'kakao',
  getOAuthProviderAdapter: vi.fn(() => ({
    provider: 'google',
    buildAuthorizeUrl: vi.fn(
      () => new URL('https://accounts.google.com/o/oauth2/v2/auth?state=oauth-state'),
    ),
  })),
}))

vi.mock('~/routes/auth/@shared/security/rate-limit', async () => {
  const actual = await vi.importActual<object>('~/routes/auth/@shared/security/rate-limit')
  return {
    ...actual,
    enforceOAuthStartRateLimit: vi.fn(async () => ({
      limited: rateLimitState.limited,
      retryAfterSeconds: 900,
      remaining: 0,
    })),
  }
})

vi.mock('~/routes/auth/@shared/audit/audit', () => ({
  logAuditEvent: logAuditEventMock,
}))

describe('oauth start handler', () => {
  beforeEach(() => {
    rateLimitState.limited = false
    createOAuthStateMock.mockClear()
    logAuditEventMock.mockClear()
  })

  it('redirects to provider authorize url', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)

    // when
    const res = await app.request('http://localhost/auth/oauth/google/start?redirect=/', {
      method: 'GET',
    })

    // then
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('accounts.google.com')
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'oauth_start',
        provider: 'google',
        resultCode: 'ok',
      }),
    )
  })

  it('returns 400 when provider is unsupported', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)

    // when
    const res = await app.request('http://localhost/auth/oauth/invalid/start?redirect=/', {
      method: 'GET',
    })

    // then
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      success: false,
    })
    expect(logAuditEventMock).not.toHaveBeenCalled()
  })

  it('returns 429 when oauth start rate limit is exceeded', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    rateLimitState.limited = true

    // when
    const res = await app.request('http://localhost/auth/oauth/google/start?redirect=/', {
      method: 'GET',
    })

    // then
    expect(res.status).toBe(429)
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_rate_limited',
    })
    expect(logAuditEventMock).not.toHaveBeenCalled()
  })

  it('normalizes disallowed redirect path to safe default', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)

    // when
    const res = await app.request(
      'http://localhost/auth/oauth/google/start?redirect=https://evil.example',
      {
        method: 'GET',
      },
    )

    // then
    expect(res.status).toBe(302)
    expect(createOAuthStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        redirectPath: 'http://localhost:3000/auth/callback/success',
      }),
    )
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'oauth_start',
        provider: 'google',
        resultCode: 'ok',
      }),
    )
  })
})
