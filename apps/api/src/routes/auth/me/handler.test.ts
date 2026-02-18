import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authIndex } from '../index'

const authenticated = {
  value: { userId: 'user-1', sessionId: 'session-1' } as {
    userId: string
    sessionId: string
  } | null,
}
const dbRows = { value: [] as unknown[] }

vi.mock('~/routes/auth/@shared/session/session', async () => {
  const actual = await vi.importActual<object>('~/routes/auth/@shared/session/session')
  return {
    ...actual,
    getAuthenticatedSession: vi.fn(async () => authenticated.value),
  }
})

vi.mock('~/db/client', () => ({
  db: {
    select: vi.fn(() => {
      const builder = {
        from: vi.fn(() => builder),
        where: vi.fn(() => builder),
        limit: vi.fn(async () => dbRows.value),
      }
      return builder
    }),
  },
}))

describe('me handler', () => {
  beforeEach(() => {
    authenticated.value = { userId: 'user-1', sessionId: 'session-1' }
    dbRows.value = [
      {
        id: 'user-1',
        email: 'demo@example.com',
        name: 'Demo',
        role: 'customer',
        status: 'active',
      },
    ]
  })

  it('returns 200 with authenticated user', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    authenticated.value = { userId: 'user-1', sessionId: 'session-1' }
    dbRows.value = [
      { id: 'user-1', email: 'demo@example.com', name: 'Demo', role: 'customer', status: 'active' },
    ]

    // when
    const res = await app.request('http://localhost/auth/me', {
      headers: { cookie: 'qc_access=access-token' },
    })

    // then
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      user: {
        id: 'user-1',
        role: 'customer',
        status: 'active',
      },
    })
  })

  it('returns 401 when access cookie is missing', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)

    // when
    const res = await app.request('http://localhost/auth/me')

    // then
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_session_expired',
    })
  })

  it('returns 401 and clears cookies when authenticated session is invalid', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    authenticated.value = null

    // when
    const res = await app.request('http://localhost/auth/me', {
      headers: { cookie: 'qc_access=invalid-access-token' },
    })

    // then
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_session_expired',
    })
    expect(res.headers.get('set-cookie') ?? '').toContain('qc_access=')
  })

  it('returns 401 and clears cookies when user row is not found', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    dbRows.value = []

    // when
    const res = await app.request('http://localhost/auth/me', {
      headers: { cookie: 'qc_access=access-token' },
    })

    // then
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_session_expired',
    })
    expect(res.headers.get('set-cookie') ?? '').toContain('qc_access=')
  })
})
