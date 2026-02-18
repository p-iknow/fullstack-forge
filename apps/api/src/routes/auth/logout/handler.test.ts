import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { authIndex } from '../index'

const sessionState = {
  authenticatedSession: { userId: 'user-1', sessionId: 'session-1' } as {
    userId: string
    sessionId: string
  } | null,
  revokeByRefreshUserId: 'user-1' as string | null,
  revokedSessionIds: [] as string[],
}

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
  logAuditEvent: vi.fn(async () => {}),
}))

describe('logout handler', () => {
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
    expect(sessionState.revokedSessionIds).toContain('session-1')
  })
})
