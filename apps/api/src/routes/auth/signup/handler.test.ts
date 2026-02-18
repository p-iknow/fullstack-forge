import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authIndex } from '../index'

type DbState = { selectQueue: unknown[]; insertReturningQueue: unknown[] }

const { dbState, logAuditEventMock } = vi.hoisted(() => ({
  dbState: { selectQueue: [], insertReturningQueue: [] } as DbState,
  logAuditEventMock: vi.fn(async () => {}),
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

vi.mock('~/routes/auth/@shared/security/password', () => ({
  hashPassword: vi.fn(async (value: string) => `hashed:${value}`),
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

vi.mock('~/routes/auth/@shared/audit/audit', () => ({
  logAuditEvent: logAuditEventMock,
}))

describe('signup handler', () => {
  beforeEach(() => {
    dbState.selectQueue = []
    dbState.insertReturningQueue = []
    logAuditEventMock.mockClear()
  })

  it('creates user and sets cookies', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    dbState.selectQueue.push([])
    dbState.insertReturningQueue.push([
      { id: 'user-1', email: 'demo@example.com', name: 'Demo', role: 'customer', status: 'active' },
    ])

    // when
    const res = await app.request('http://localhost/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.com', password: 'Passw0rd!', name: 'Demo' }),
    })

    // then
    expect(res.status).toBe(201)
    expect(res.headers.get('set-cookie') ?? '').toContain('qc_access=')
  })
})
