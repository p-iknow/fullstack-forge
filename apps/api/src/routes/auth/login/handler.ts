import { eq } from 'drizzle-orm'
import type { RouteHandler } from '@hono/zod-openapi'
import { db } from '~/db/client'
import { loginRoute } from '@fullstack-forge/api-spec/routes/auth'
import { userCredentials, users } from '~/db/schema/index'
import { logAuditEvent } from '~/routes/auth/@shared/audit/audit'
import { clearLoginFailureState, getLockStateTtl, registerLoginFailure } from './account-lockout'
import { verifyPassword } from '~/routes/auth/@shared/security/password'
import { enforceLoginRateLimit } from '~/routes/auth/@shared/security/rate-limit'
import { createSession } from '~/routes/auth/@shared/session/session'
import { getRequestMeta, setAuthCookies } from '~/routes/auth/@shared/http/service'

export const loginHandler: RouteHandler<typeof loginRoute> = async (c) => {
  const body = c.req.valid('json')

  const requestMeta = getRequestMeta(c)
  const loginRateLimit = await enforceLoginRateLimit(c, requestMeta.ipAddress ?? 'unknown')
  if (loginRateLimit.limited) {
    return c.json({ code: 'auth_rate_limited', error: 'Too many requests' }, 429)
  }

  const [foundUser] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      passwordHash: userCredentials.passwordHash,
    })
    .from(users)
    .innerJoin(userCredentials, eq(userCredentials.userId, users.id))
    .where(eq(users.email, body.email))
    .limit(1)

  if (!foundUser) {
    await logAuditEvent({
      event: 'login_failed',
      userId: null,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      requestId: requestMeta.requestId,
      resultCode: 'auth_invalid_credentials',
    })
    return c.json({ code: 'auth_invalid_credentials', error: 'Invalid credentials' }, 401)
  }

  const lockedTtl = await getLockStateTtl(foundUser.id)
  if (lockedTtl !== null) {
    if (foundUser.status !== 'locked') {
      await db.update(users).set({ status: 'locked' }).where(eq(users.id, foundUser.id))
    }

    c.header('Retry-After', String(lockedTtl))
    return c.json({ code: 'auth_account_locked', error: 'Account is not active' }, 403)
  }

  if (foundUser.status === 'locked') {
    await db.update(users).set({ status: 'active' }).where(eq(users.id, foundUser.id))
    foundUser.status = 'active'
  }

  if (foundUser.status !== 'active') {
    await logAuditEvent({
      event: 'login_failed',
      userId: foundUser.id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      requestId: requestMeta.requestId,
      resultCode: 'auth_account_locked',
    })
    return c.json({ code: 'auth_account_locked', error: 'Account is not active' }, 403)
  }

  const validPassword = await verifyPassword(foundUser.passwordHash, body.password)
  if (!validPassword) {
    const failure = await registerLoginFailure(foundUser.id)
    if (failure.locked) {
      await db.update(users).set({ status: 'locked' }).where(eq(users.id, foundUser.id))
      c.header('Retry-After', String(failure.retryAfterSeconds))
      await logAuditEvent({
        event: 'login_failed',
        userId: foundUser.id,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        requestId: requestMeta.requestId,
        resultCode: 'auth_account_locked',
      })
      return c.json({ code: 'auth_account_locked', error: 'Account is not active' }, 403)
    }

    await logAuditEvent({
      event: 'login_failed',
      userId: foundUser.id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      requestId: requestMeta.requestId,
      resultCode: 'auth_invalid_credentials',
    })
    return c.json({ code: 'auth_invalid_credentials', error: 'Invalid credentials' }, 401)
  }

  await clearLoginFailureState(foundUser.id)
  if (foundUser.status !== 'active') {
    await db.update(users).set({ status: 'active' }).where(eq(users.id, foundUser.id))
    foundUser.status = 'active'
  }

  const session = await createSession(foundUser.id)
  setAuthCookies(c, session.accessToken, session.refreshToken)

  await logAuditEvent({
    event: 'login_success',
    userId: foundUser.id,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
    requestId: requestMeta.requestId,
    resultCode: 'ok',
  })

  return c.json(
    {
      user: {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        status: foundUser.status,
      },
    },
    200,
  )
}
