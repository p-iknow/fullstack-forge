import { and, eq } from 'drizzle-orm'
import { getCookie } from 'hono/cookie'
import type { RouteHandler } from '@hono/zod-openapi'
import { meRoute } from '@fullstack-forge/api-spec/routes/auth'
import { db } from '~/db/client'
import { users } from '~/db/schema/index'
import { ACCESS_COOKIE_NAME } from '~/routes/auth/@shared/config/constants'
import { getAuthenticatedSession } from '~/routes/auth/@shared/session/session'
import { clearAuthCookies } from '~/routes/auth/@shared/http/service'

export const meHandler: RouteHandler<typeof meRoute> = async (c) => {
  const accessToken = getCookie(c, ACCESS_COOKIE_NAME)
  if (!accessToken) {
    return c.json({ code: 'auth_session_expired', error: 'Session expired' }, 401)
  }

  const session = await getAuthenticatedSession(accessToken)
  if (!session) {
    clearAuthCookies(c)
    return c.json({ code: 'auth_session_expired', error: 'Session expired' }, 401)
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(and(eq(users.id, session.userId), eq(users.status, 'active')))
    .limit(1)

  if (!user) {
    clearAuthCookies(c)
    return c.json({ code: 'auth_session_expired', error: 'Session expired' }, 401)
  }

  return c.json({ user }, 200)
}
