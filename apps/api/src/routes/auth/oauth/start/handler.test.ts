import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { authIndex } from '~/routes/auth/index'

vi.mock('~/routes/auth/oauth/@shared/state', () => ({
  createOAuthState: vi.fn(async () => ({
    state: 'oauth-state',
    provider: 'google',
    nonce: 'oauth-nonce',
    redirectPath: '/',
  })),
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

describe('oauth start handler', () => {
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
  })
})
