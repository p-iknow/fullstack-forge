import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authIndex } from '~/routes/auth/index'

const {
  consumePasswordResetTokenMock,
  hashPasswordMock,
  revokeAllUserSessionsMock,
  logAuditEventMock,
  updateState,
} = vi.hoisted(() => ({
  consumePasswordResetTokenMock: vi.fn(async () => 'user-1' as string | null),
  hashPasswordMock: vi.fn(async (password: string) => `hashed:${password}`),
  revokeAllUserSessionsMock: vi.fn(async () => {}),
  logAuditEventMock: vi.fn(async () => {}),
  updateState: { values: [] as unknown[] },
}))

vi.mock('~/db/client', () => ({
  db: {
    update: vi.fn(() => ({
      set: vi.fn((values: unknown) => {
        updateState.values.push(values)
        return {
          where: vi.fn(async () => []),
        }
      }),
    })),
  },
}))

vi.mock('~/routes/auth/password-reset/@shared/token-store', () => ({
  consumePasswordResetToken: consumePasswordResetTokenMock,
}))

vi.mock('~/routes/auth/@shared/security/password', () => ({
  hashPassword: hashPasswordMock,
}))

vi.mock('~/routes/auth/@shared/session/session', async () => {
  const actual = await vi.importActual<object>('~/routes/auth/@shared/session/session')
  return {
    ...actual,
    revokeAllUserSessions: revokeAllUserSessionsMock,
  }
})

vi.mock('~/routes/auth/@shared/audit/audit', () => ({
  logAuditEvent: logAuditEventMock,
}))

describe('password reset confirm handler', () => {
  beforeEach(() => {
    consumePasswordResetTokenMock.mockResolvedValue('user-1')
    hashPasswordMock.mockClear()
    revokeAllUserSessionsMock.mockClear()
    logAuditEventMock.mockClear()
    updateState.values = []
  })

  it('returns 401 when reset token is invalid', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    consumePasswordResetTokenMock.mockResolvedValue(null)

    // when
    const res = await app.request('http://localhost/auth/password-reset/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-token', password: 'NewPassw0rd!' }),
    })

    // then
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_session_expired',
    })
    expect(hashPasswordMock).not.toHaveBeenCalled()
    expect(revokeAllUserSessionsMock).not.toHaveBeenCalled()
    expect(logAuditEventMock).not.toHaveBeenCalled()
  })

  it('updates password, revokes sessions, and logs audit event', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)

    // when
    const res = await app.request('http://localhost/auth/password-reset/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token', password: 'NewPassw0rd!' }),
    })

    // then
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true })
    expect(hashPasswordMock).toHaveBeenCalledWith('NewPassw0rd!')
    expect(updateState.values).toHaveLength(1)
    expect(updateState.values[0]).toEqual(
      expect.objectContaining({
        passwordHash: 'hashed:NewPassw0rd!',
      }),
    )
    expect(revokeAllUserSessionsMock).toHaveBeenCalledWith('user-1')
    expect(res.headers.get('set-cookie') ?? '').toContain('qc_access=')
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'password_reset_confirm',
        userId: 'user-1',
        resultCode: 'ok',
      }),
    )
  })
})
