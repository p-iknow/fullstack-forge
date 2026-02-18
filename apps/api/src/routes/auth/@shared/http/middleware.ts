import { eq } from 'drizzle-orm'
import { authRoles, authUserStatuses } from '@fullstack-forge/api-spec/auth-types'
import type { AuthRole, AuthUser } from '@fullstack-forge/api-spec/auth-types'
import type { Context, MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import { db } from '~/db/client'
import { users } from '~/db/schema/index'
import { ACCESS_COOKIE_NAME } from '~/routes/auth/@shared/config/constants'
import { getAuthenticatedSession } from '~/routes/auth/@shared/session/session'

const AUTH_USER_KEY = 'authUser'

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const accessToken = getCookie(c, ACCESS_COOKIE_NAME)
  if (!accessToken) {
    return c.json({ code: 'auth_session_expired', error: 'Session expired' }, 401)
  }

  const authenticated = await getAuthenticatedSession(accessToken)
  if (!authenticated) {
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
    .where(eq(users.id, authenticated.userId))
    .limit(1)

  if (!user || user.status !== 'active') {
    return c.json({ code: 'auth_session_expired', error: 'Session expired' }, 401)
  }

  c.set(AUTH_USER_KEY, user)
  return next()
}

export const requireRole = (roles: AuthRole[]): MiddlewareHandler => {
  return async (c, next) => {
    const user = c.get(AUTH_USER_KEY) as AuthUser | undefined
    if (!user) {
      return c.json({ code: 'auth_session_expired', error: 'Session expired' }, 401)
    }

    if (!roles.includes(user.role)) {
      return c.json({ code: 'auth_forbidden', error: 'Forbidden' }, 403)
    }

    return next()
  }
}

export const getAuthUser = (c: Context): AuthUser | null => {
  const value = c.get(AUTH_USER_KEY)
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<AuthUser>
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.email !== 'string' ||
    typeof candidate.name !== 'string' ||
    !candidate.role ||
    !authRoles.includes(candidate.role) ||
    !candidate.status ||
    !authUserStatuses.includes(candidate.status)
  ) {
    return null
  }

  return candidate as AuthUser
}
