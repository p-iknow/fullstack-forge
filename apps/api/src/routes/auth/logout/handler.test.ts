import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authIndex } from '../index'

const { sessionState, logoutRateLimitState, logAuditEventMock } = vi.hoisted(() => ({
  sessionState: {
    authenticatedSession: { userId: 'user-1', sessionId: 'session-1' } as {
      userId: string
      sessionId: string
    } | null,
    revokeByRefreshUserId: 'user-1' as string | null,
    revokedSessionIds: [] as string[],
  },
  logoutRateLimitState: { limited: false },
  logAuditEventMock: vi.fn(async () => {}),
}))

vi.mock('~/routes/auth/@shared/session/session', async () => {
  const actual = await vi.importActual<object>('~/routes/auth/@shared/session/session')
  return {
    ...actual,
    getAuthenticatedSession: vi.fn(async () => sessionState.authenticatedSession),
    revokeByRefreshToken: vi.fn(async () => sessionState.revokeByRefreshUserId),
    revokeSession: vi.fn(async (sessionId: string) => {
      sessionState.revokedSessionIds.push(sessionId)
    }),
  }
})

vi.mock('~/routes/auth/@shared/audit/audit', () => ({
  logAuditEvent: logAuditEventMock,
}))

vi.mock('~/routes/auth/@shared/security/rate-limit', async () => {
  const actual = await vi.importActual<object>('~/routes/auth/@shared/security/rate-limit')
  return {
    ...actual,
    enforceLogoutRateLimit: vi.fn(async () => ({
      limited: logoutRateLimitState.limited,
      retryAfterSeconds: 900,
      remaining: 0,
    })),
  }
})

describe('logout handler', () => {
  beforeEach(() => {
    sessionState.authenticatedSession = { userId: 'user-1', sessionId: 'session-1' }
    sessionState.revokeByRefreshUserId = 'user-1'
    sessionState.revokedSessionIds = []
    logoutRateLimitState.limited = false
    logAuditEventMock.mockClear()
  })

  it('revokes session and clears cookies', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)

    // when
    const res = await app.request('http://localhost/auth/logout', {
      method: 'POST',
      headers: { cookie: 'qc_access=access-token; qc_refresh=refresh-token' },
    })

    // then
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true })
    expect(sessionState.revokedSessionIds).toContain('session-1')
    expect(res.headers.get('set-cookie') ?? '').toContain('qc_refresh=')
    expect(logAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'logout',
        userId: 'user-1',
        resultCode: 'ok',
      }),
    )
  })

  it('returns 429 when logout rate limit is exceeded', async () => {
    // given
    const app = new Hono()
    app.route('/auth', authIndex)
    logoutRateLimitState.limited = true

    // when
    const res = await app.request('http://localhost/auth/logout', {
      method: 'POST',
      headers: { cookie: 'qc_access=access-token; qc_refresh=refresh-token' },
    })

    // then
    expect(res.status).toBe(429)
    await expect(res.json()).resolves.toMatchObject({
      code: 'auth_rate_limited',
    })
    expect(logAuditEventMock).not.toHaveBeenCalled()
  })
})
