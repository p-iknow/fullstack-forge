import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authIndex } from '../index'

type DbState = { selectQueue: unknown[] }

const { dbState, rateLimitedState, lockState } = vi.hoisted(() => ({
  dbState: { selectQueue: [] } as DbState,
  rateLimitedState: { value: false },
  lockState: { ttl: null as number | null },
}))

vi.mock('~/db/client', () => ({
  db: {
    select: vi.fn(() => {
      const builder = {
        from: vi.fn(() => builder),
        innerJoin: vi.fn(() => builder),
        where: vi.fn(() => builder),
        limit: vi.fn(async () => (dbState.selectQueue.shift() ?? []) as unknown[]),
      }
      return builder
    }),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(async () => []) })) })),
  },
}))

vi.mock('~/routes/auth/@shared/security/password', () => ({
  verifyPassword: vi.fn(async () => false),
}))

vi.mock('~/routes/auth/@shared/audit/audit', () => ({
  logAuditEvent: vi.fn(async () => {}),
}))

vi.mock('~/routes/auth/@shared/security/rate-limit', async () => {
  const actual = await vi.importActual<object>('~/routes/auth/@shared/security/rate-limit')
  return {
    ...actual,
    enforceLoginRateLimit: vi.fn(async () => ({
      limited: rateLimitedState.value,
      retryAfterSeconds: 900,
      remaining: 0,
    })),
  }
})

vi.mock('~/routes/auth/login/account-lockout', () => ({
  getLockStateTtl: vi.fn(async () => lockState.ttl),
  registerLoginFailure: vi.fn(async () => ({ locked: false, retryAfterSeconds: 900 })),
  clearLoginFailureState: vi.fn(async () => {}),
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

describe('login handler', () => {
  beforeEach(() => {
    dbState.selectQueue = []
    rateLimitedState.value = false
    lockState.ttl = null
  })

  it('returns 401 for missing user', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    dbState.selectQueue.push([])

    // when
    const res = await app.request('http://localhost/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'missing@example.com', password: 'Passw0rd!' }),
    })

    // then
    expect(res.status).toBe(401)
  })

  it('returns 429 when rate limited', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    rateLimitedState.value = true

    // when
    const res = await app.request('http://localhost/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.com', password: 'Passw0rd!' }),
    })

    // then
    expect(res.status).toBe(429)
  })

  it('returns 403 when lock state exists', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    dbState.selectQueue.push([
      {
        id: 'user-1',
        email: 'demo@example.com',
        name: 'Demo',
        role: 'customer',
        status: 'locked',
        passwordHash: 'hashed:Passw0rd!',
      },
    ])
    lockState.ttl = 120

    // when
    const res = await app.request('http://localhost/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.com', password: 'Passw0rd!' }),
    })

    // then
    expect(res.status).toBe(403)
  })
})
