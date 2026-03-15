import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authIndex } from '~/routes/auth/index'

const oauthState = {
  consumed: {
    state: 'oauth-state',
    provider: 'google' as const,
    nonce: 'oauth-nonce',
    redirectPath: '/',
  } as { state: string; provider: 'google' | 'kakao'; nonce: string; redirectPath: string } | null,
}

const dbState = { selectQueue: [] as unknown[], insertReturningQueue: [] as unknown[] }

vi.mock('~/routes/auth/oauth/@shared/state', () => ({
  consumeOAuthState: vi.fn(async () => oauthState.consumed),
}))

vi.mock('~/routes/auth/oauth/@shared/providers', () => ({
  isOAuthProvider: (value: string) => value === 'google' || value === 'kakao',
  getOAuthProviderAdapter: vi.fn(() => ({
    provider: 'google',
    exchangeCodeForProfile: vi.fn(async () => ({
      providerUserId: 'google-user-1',
      email: 'oauth@example.com',
      name: 'OAuth User',
    })),
  })),
}))

vi.mock('~/db/client', () => ({
  db: {
    select: vi.fn(() => {
      const builder = {
        from: vi.fn(() => builder),
        where: vi.fn(() => builder),
        limit: vi.fn(async () => (dbState.selectQueue.shift() ?? []) as unknown[]),
      }
      return builder
    }),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => (dbState.insertReturningQueue.shift() ?? []) as unknown[]),
      })),
    })),
  },
}))

vi.mock('~/routes/auth/@shared/session/session', async () => {
  const actual = await vi.importActual<object>('~/routes/auth/@shared/session/session')
  return {
    ...actual,
    createSession: vi.fn(async () => ({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      sessionId: 'session-id',
    })),
  }
})

describe('oauth callback handler', () => {
  beforeEach(() => {
    oauthState.consumed = {
      state: 'oauth-state',
      provider: 'google',
      nonce: 'oauth-nonce',
      redirectPath: '/',
    }
    dbState.selectQueue = []
    dbState.insertReturningQueue = []
  })

  it('returns 400 when oauth state is invalid', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    oauthState.consumed = null

    // when
    const res = await app.request(
      'http://localhost/auth/oauth/google/callback?code=abc&state=invalid',
      {
        method: 'GET',
      },
    )

    // then
    expect(res.status).toBe(400)
  })

  it('creates oauth session and redirects to frontend', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    dbState.selectQueue.push([])
    dbState.selectQueue.push([])
    dbState.insertReturningQueue.push([{ id: 'oauth-user-id' }])

    // when
    const res = await app.request(
      'http://localhost/auth/oauth/google/callback?code=abc&state=oauth-state',
      {
        method: 'GET',
      },
    )

    // then
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('http://localhost:3000/')
  })
})
