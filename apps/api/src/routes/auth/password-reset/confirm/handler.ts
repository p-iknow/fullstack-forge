import { eq } from 'drizzle-orm'
import type { RouteHandler } from '@hono/zod-openapi'
import { passwordResetConfirmRoute } from '@fullstack-forge/api-spec/routes/auth'
import { db } from '~/db/client'
import { userCredentials } from '~/db/schema/index'
import { logAuditEvent } from '~/routes/auth/@shared/audit/audit'
import { clearAuthCookies, getRequestMeta } from '~/routes/auth/@shared/http/service'
import { hashPassword } from '~/routes/auth/@shared/security/password'
import { revokeAllUserSessions } from '~/routes/auth/@shared/session/session'
import { consumePasswordResetToken } from '~/routes/auth/password-reset/@shared/token-store'

export const passwordResetConfirmHandler: RouteHandler<typeof passwordResetConfirmRoute> = async (
  c,
) => {
  const body = c.req.valid('json')
  const requestMeta = getRequestMeta(c)

  const userId = await consumePasswordResetToken(body.token)
  if (!userId) {
    return c.json({ code: 'auth_session_expired', error: 'Session expired' }, 401)
  }

  const passwordHash = await hashPassword(body.password)
  await db
    .update(userCredentials)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(userCredentials.userId, userId))

  await revokeAllUserSessions(userId)
  clearAuthCookies(c)

  await logAuditEvent({
    event: 'password_reset_confirm',
    userId,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
    requestId: requestMeta.requestId,
    resultCode: 'ok',
  })

  return c.json({ ok: true as const }, 200)
}
