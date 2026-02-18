import { eq } from 'drizzle-orm'
import type { RouteHandler } from '@hono/zod-openapi'
import { signupRoute } from '@fullstack-forge/api-spec/routes/auth'
import { db } from '~/db/client'
import { userCredentials, users } from '~/db/schema/index'
import { logAuditEvent } from '~/routes/auth/@shared/audit/audit'
import { hashPassword } from '~/routes/auth/@shared/security/password'
import { createSession } from '~/routes/auth/@shared/session/session'
import { getRequestMeta, setAuthCookies } from '~/routes/auth/@shared/http/service'

export const signupHandler: RouteHandler<typeof signupRoute> = async (c) => {
  const body = c.req.valid('json')

  const requestMeta = getRequestMeta(c)
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1)

  if (existing.length > 0) {
    return c.json({ code: 'auth_email_conflict', error: 'Email already in use' }, 409)
  }

  const passwordHash = await hashPassword(body.password)

  const [createdUser] = await db
    .insert(users)
    .values({
      email: body.email,
      name: body.name,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
    })

  await db.insert(userCredentials).values({
    userId: createdUser.id,
    passwordHash,
  })

  const session = await createSession(createdUser.id)
  setAuthCookies(c, session.accessToken, session.refreshToken)

  await logAuditEvent({
    event: 'signup_success',
    userId: createdUser.id,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
    requestId: requestMeta.requestId,
    resultCode: 'ok',
  })

  return c.json({ user: createdUser }, 201)
}
