import { createRouter } from '~/lib/create-app'
import { adminDashboardRoute, adminRedriveRoute } from '@fullstack-forge/api-spec/routes/admin'
import { getAuthUser, requireAuth } from '~/routes/auth/@shared/http/middleware'

export const adminIndex = createRouter()

adminIndex.use('*', requireAuth)

const dashboardHandler = async (
  c: Parameters<typeof adminIndex.openapi>[1] extends (arg: infer T, ...rest: never[]) => unknown
    ? T
    : never,
) => {
  const user = getAuthUser(c)

  if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
    return c.json({ code: 'auth_forbidden', error: 'Forbidden' }, 403)
  }

  return c.json(
    {
      ok: true,
      role: user?.role ?? null,
    },
    200,
  )
}

const redriveHandler = async (
  c: Parameters<typeof adminIndex.openapi>[1] extends (arg: infer T, ...rest: never[]) => unknown
    ? T
    : never,
) => {
  const user = getAuthUser(c)

  if (!user || user.role !== 'admin') {
    return c.json({ code: 'auth_forbidden', error: 'Forbidden' }, 403)
  }

  return c.json(
    {
      ok: true,
      action: 'redrive_started' as const,
      requestedBy: user?.id ?? null,
    },
    200,
  )
}

adminIndex.openapi(adminDashboardRoute, dashboardHandler)
adminIndex.openapi(adminRedriveRoute, redriveHandler)
