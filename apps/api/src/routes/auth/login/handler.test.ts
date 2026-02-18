import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authIndex } from '../index'

type DbState = { selectQueue: unknown[] }

const {
  dbState,
  rateLimitedState,
  lockState,
  passwordState,
  registerFailureState,
  logAuditEventMock,
} = vi.hoisted(() => ({
  dbState: { selectQueue: [] } as DbState,
  rateLimitedState: { value: false },
  lockState: { ttl: null as number | null },
  passwordState: { valid: false },
  registerFailureState: { locked: false, retryAfterSeconds: 900 },
  logAuditEventMock: vi.fn(async () => {}),
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
  verifyPassword: vi.fn(async () => passwordState.valid),
}))

vi.mock('~/routes/auth/@shared/audit/audit', () => ({
  logAuditEvent: logAuditEventMock,
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
  registerLoginFailure: vi.fn(async () => registerFailureState),
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
    passwordState.valid = false
    registerFailureState.locked = false
    registerFailureState.retryAfterSeconds = 900
    logAuditEventMock.mockClear()
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
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_invalid_credentials',
    })
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'login_failed',
        userId: null,
        resultCode: 'auth_invalid_credentials',
      }),
    )
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
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_rate_limited',
    })
    expect(logAuditEventMock).not.toHaveBeenCalled()
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
    expect(res.headers.get('retry-after')).toBe('120')
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_account_locked',
    })
  })

  it('returns 401 when password is invalid and logs failure', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    dbState.selectQueue.push([
      {
        id: 'user-1',
        email: 'demo@example.com',
        name: 'Demo',
        role: 'customer',
        status: 'active',
        passwordHash: 'hashed:Passw0rd!',
      },
    ])

    // when
    const res = await app.request('http://localhost/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.com', password: 'wrong-password' }),
    })

    // then
    expect(res.status).toBe(401)
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'login_failed',
        userId: 'user-1',
        resultCode: 'auth_invalid_credentials',
      }),
    )
  })

  it('returns 200 with cookies when credentials are valid', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    passwordState.valid = true
    dbState.selectQueue.push([
      {
        id: 'user-1',
        email: 'demo@example.com',
        name: 'Demo',
        role: 'customer',
        status: 'active',
        passwordHash: 'hashed:Passw0rd!',
      },
    ])

    // when
    const res = await app.request('http://localhost/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.com', password: 'Passw0rd!' }),
    })

    // then
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie') ?? '').toContain('qc_access=access-token')
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'login_success',
        userId: 'user-1',
        resultCode: 'ok',
      }),
    )
  })

  it('returns 403 and retry header when failure threshold locks account', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    registerFailureState.locked = true
    registerFailureState.retryAfterSeconds = 120
    dbState.selectQueue.push([
      {
        id: 'user-1',
        email: 'demo@example.com',
        name: 'Demo',
        role: 'customer',
        status: 'active',
        passwordHash: 'hashed:Passw0rd!',
      },
    ])

    // when
    const res = await app.request('http://localhost/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.com', password: 'wrong-password' }),
    })

    // then
    expect(res.status).toBe(403)
    expect(res.headers.get('retry-after')).toBe('120')
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'login_failed',
        userId: 'user-1',
        resultCode: 'auth_account_locked',
      }),
    )
  })
})
