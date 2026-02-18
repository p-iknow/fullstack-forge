import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authIndex } from '~/routes/auth/index'

type DbState = { selectQueue: unknown[] }

const { dbState, createPasswordResetTokenMock, logAuditEventMock } = vi.hoisted(() => ({
  dbState: { selectQueue: [] } as DbState,
  createPasswordResetTokenMock: vi.fn(async () => 'reset-token'),
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
  },
}))

vi.mock('~/routes/auth/password-reset/@shared/token-store', () => ({
  createPasswordResetToken: createPasswordResetTokenMock,
}))

vi.mock('~/routes/auth/@shared/audit/audit', () => ({
  logAuditEvent: logAuditEventMock,
}))

describe('password reset request handler', () => {
  beforeEach(() => {
    dbState.selectQueue = []
    createPasswordResetTokenMock.mockClear()
    logAuditEventMock.mockClear()
  })

  it('returns 200 and creates token when user exists', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    dbState.selectQueue.push([{ id: 'user-1' }])

    // when
    const res = await app.request('http://localhost/auth/password-reset/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.com' }),
    })

    // then
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true })
    expect(createPasswordResetTokenMock).toHaveBeenCalledWith('user-1')
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'password_reset_request',
        userId: 'user-1',
        resultCode: 'ok',
      }),
    )
  })

  it('returns 200 and does not create token when user does not exist', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    dbState.selectQueue.push([])

    // when
    const res = await app.request('http://localhost/auth/password-reset/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'missing@example.com' }),
    })

    // then
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true })
    expect(createPasswordResetTokenMock).not.toHaveBeenCalled()
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'password_reset_request',
        userId: null,
        resultCode: 'ok',
      }),
    )
  })
})
