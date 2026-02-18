import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authIndex } from '../index'

type RotateResult =
  | {
      kind: 'ok'
      userId: string
      accessToken: string
      refreshToken: string
      sessionId: string
    }
  | { kind: 'invalid' }
  | { kind: 'expired'; userId: string }
  | { kind: 'reuse_detected'; userId: string }

const { rotateResult, logAuditEventMock } = vi.hoisted(() => ({
  rotateResult: {
    value: {
      kind: 'ok',
      userId: 'user-1',
      accessToken: 'rotated-access',
      refreshToken: 'rotated-refresh',
      sessionId: 'rotated-session',
    } as RotateResult,
  },
  logAuditEventMock: vi.fn(async () => {}),
}))

vi.mock('~/routes/auth/@shared/session/session', async () => {
  const actual = await vi.importActual<object>('~/routes/auth/@shared/session/session')
  return {
    ...actual,
    rotateRefreshToken: vi.fn(async () => rotateResult.value),
  }
})

vi.mock('~/routes/auth/@shared/audit/audit', () => ({
  logAuditEvent: logAuditEventMock,
}))

describe('refresh handler', () => {
  beforeEach(() => {
    rotateResult.value = {
      kind: 'ok',
      userId: 'user-1',
      accessToken: 'rotated-access',
      refreshToken: 'rotated-refresh',
      sessionId: 'rotated-session',
    }
    logAuditEventMock.mockClear()
  })

  it('rotates refresh token and returns 200', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)

    // when
    const res = await app.request('http://localhost/auth/refresh', {
      method: 'POST',
      headers: { cookie: 'qc_refresh=refresh-token' },
    })

    // then
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true })
    expect(res.headers.get('set-cookie') ?? '').toContain('qc_access=rotated-access')
    expect(logAuditEventMock).not.toHaveBeenCalled()
  })

  it('returns 401 when refresh cookie is missing', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)

    // when
    const res = await app.request('http://localhost/auth/refresh', {
      method: 'POST',
    })

    // then
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_session_expired',
    })
  })

  it('returns 401 and clears cookies when refresh token is invalid', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    rotateResult.value = { kind: 'invalid' }

    // when
    const res = await app.request('http://localhost/auth/refresh', {
      method: 'POST',
      headers: { cookie: 'qc_refresh=invalid-refresh-token' },
    })

    // then
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_session_expired',
    })
    expect(res.headers.get('set-cookie') ?? '').toContain('qc_access=')
    expect(logAuditEventMock).not.toHaveBeenCalled()
  })

  it('logs session_revoked when refresh token is expired', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    rotateResult.value = { kind: 'expired', userId: 'user-1' }

    // when
    const res = await app.request('http://localhost/auth/refresh', {
      method: 'POST',
      headers: { cookie: 'qc_refresh=expired-refresh-token' },
    })

    // then
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_session_expired',
    })
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'session_revoked',
        userId: 'user-1',
        resultCode: 'auth_session_expired',
      }),
    )
  })

  it('logs reuse detection and returns 401 for reused refresh token', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    rotateResult.value = { kind: 'reuse_detected', userId: 'user-1' }

    // when
    const res = await app.request('http://localhost/auth/refresh', {
      method: 'POST',
      headers: { cookie: 'qc_refresh=reused-refresh-token' },
    })

    // then
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_session_expired',
    })
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'session_revoked',
        userId: 'user-1',
        resultCode: 'auth_refresh_reuse_detected',
      }),
    )
  })
})
