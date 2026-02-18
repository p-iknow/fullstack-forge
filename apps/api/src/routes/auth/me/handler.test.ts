import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
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
  })
})
