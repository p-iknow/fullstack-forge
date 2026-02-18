import { getCookie } from 'hono/cookie'
import type { RouteHandler } from '@hono/zod-openapi'
import { logoutRoute } from '@fullstack-forge/api-spec/routes/auth'
import { logAuditEvent } from '~/routes/auth/@shared/audit/audit'
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '~/routes/auth/@shared/config/constants'
import { enforceLogoutRateLimit } from '~/routes/auth/@shared/security/rate-limit'
import {
  getAuthenticatedSession,
  revokeByRefreshToken,
  revokeSession,
} from '~/routes/auth/@shared/session/session'
import { clearAuthCookies, getRequestMeta } from '~/routes/auth/@shared/http/service'

export const logoutHandler: RouteHandler<typeof logoutRoute> = async (c) => {
  const requestMeta = getRequestMeta(c)
  const accessToken = getCookie(c, ACCESS_COOKIE_NAME)
  const refreshToken = getCookie(c, REFRESH_COOKIE_NAME)

  let userId: string | null = null
  let accessSessionId: string | null = null

  if (accessToken) {
    const session = await getAuthenticatedSession(accessToken)
    if (session) {
      userId = session.userId
      accessSessionId = session.sessionId
    }
  }

  const logoutRateLimit = await enforceLogoutRateLimit(
    c,
    userId ?? requestMeta.ipAddress ?? 'unknown',
  )
  if (logoutRateLimit.limited) {
    return c.json({ code: 'auth_rate_limited', error: 'Too many requests' }, 429)
  }

  if (accessSessionId) {
    await revokeSession(accessSessionId)
  }

  if (!userId && accessToken) {
    const session = await getAuthenticatedSession(accessToken)
    if (session) {
      userId = session.userId
    }
  }

  if (refreshToken) {
    const revokedUserId = await revokeByRefreshToken(refreshToken)
    if (revokedUserId) {
      userId = revokedUserId
    }
  }

  clearAuthCookies(c)

  await logAuditEvent({
    event: 'logout',
    userId,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
    requestId: requestMeta.requestId,
    resultCode: 'ok',
  })

  return c.json({ ok: true as const }, 200)
}
