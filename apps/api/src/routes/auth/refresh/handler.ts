import { getCookie } from 'hono/cookie'
import type { RouteHandler } from '@hono/zod-openapi'
import { refreshRoute } from '@fullstack-forge/api-spec/routes/auth'
import { logAuditEvent } from '~/routes/auth/@shared/audit/audit'
import { REFRESH_COOKIE_NAME } from '~/routes/auth/@shared/config/constants'
import { rotateRefreshToken } from '~/routes/auth/@shared/session/session'
import {
  clearAuthCookies,
  getRequestMeta,
  setAuthCookies,
} from '~/routes/auth/@shared/http/service'

export const refreshHandler: RouteHandler<typeof refreshRoute> = async (c) => {
  const requestMeta = getRequestMeta(c)
  const refreshToken = getCookie(c, REFRESH_COOKIE_NAME)
  if (!refreshToken) {
    return c.json({ code: 'auth_session_expired', error: 'Session expired' }, 401)
  }

  const rotated = await rotateRefreshToken(refreshToken)
  if (rotated.kind === 'invalid') {
    clearAuthCookies(c)
    return c.json({ code: 'auth_session_expired', error: 'Session expired' }, 401)
  }

  if (rotated.kind === 'expired') {
    clearAuthCookies(c)
    await logAuditEvent({
      event: 'session_revoked',
      userId: rotated.userId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      requestId: requestMeta.requestId,
      resultCode: 'auth_session_expired',
    })
    return c.json({ code: 'auth_session_expired', error: 'Session expired' }, 401)
  }

  if (rotated.kind === 'reuse_detected') {
    clearAuthCookies(c)
    await logAuditEvent({
      event: 'session_revoked',
      userId: rotated.userId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      requestId: requestMeta.requestId,
      resultCode: 'auth_refresh_reuse_detected',
    })
    return c.json({ code: 'auth_session_expired', error: 'Session expired' }, 401)
  }

  setAuthCookies(c, rotated.accessToken, rotated.refreshToken)
  return c.json({ ok: true as const }, 200)
}
