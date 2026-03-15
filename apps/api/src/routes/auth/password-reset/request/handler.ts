import { eq } from 'drizzle-orm'
import type { RouteHandler } from '@hono/zod-openapi'
import { passwordResetRequestRoute } from '@fullstack-forge/api-spec/routes/auth'
import { db } from '~/db/client'
import { users } from '~/db/schema/index'
import { logAuditEvent } from '~/routes/auth/@shared/audit/audit'
import { getRequestMeta } from '~/routes/auth/@shared/http/service'
import { sendPasswordResetEmail } from '~/routes/auth/password-reset/@shared/email'
import { createPasswordResetToken } from '~/routes/auth/password-reset/@shared/token-store'

export const passwordResetRequestHandler: RouteHandler<typeof passwordResetRequestRoute> = async (
  c,
) => {
  const body = c.req.valid('json')
  const requestMeta = getRequestMeta(c)

  const [foundUser] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1)

  if (foundUser) {
    const resetToken = await createPasswordResetToken(foundUser.id)
    try {
      await sendPasswordResetEmail({
        toEmail: foundUser.email,
        token: resetToken,
      })
    } catch (error) {
      // eslint-disable-next-line no-console -- intentional server-side error logging
      console.error('[auth] password reset mail send failed', {
        userId: foundUser.id,
        error,
      })
    }
  }

  await logAuditEvent({
    event: 'password_reset_request',
    userId: foundUser?.id ?? null,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
    requestId: requestMeta.requestId,
    resultCode: 'ok',
  })

  return c.json({ ok: true as const }, 200)
}
