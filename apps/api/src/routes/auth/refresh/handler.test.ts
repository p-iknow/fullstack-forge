import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { authIndex } from '../index'

const rotateResult = {
  value: {
    kind: 'ok',
    userId: 'user-1',
    accessToken: 'rotated-access',
    refreshToken: 'rotated-refresh',
    sessionId: 'rotated-session',
  } as
    | {
        kind: 'ok'
        userId: string
        accessToken: string
        refreshToken: string
        sessionId: string
      }
    | { kind: 'invalid' }
    | { kind: 'expired'; userId: string }
    | { kind: 'reuse_detected'; userId: string },
}

vi.mock('~/routes/auth/@shared/session/session', async () => {
  const actual = await vi.importActual<object>('~/routes/auth/@shared/session/session')
  return {
    ...actual,
    rotateRefreshToken: vi.fn(async () => rotateResult.value),
  }
})

describe('refresh handler', () => {
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
    expect(res.headers.get('set-cookie') ?? '').toContain('qc_access=rotated-access')
  })
})
