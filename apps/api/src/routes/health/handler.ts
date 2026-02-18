import type { RouteHandler } from '@hono/zod-openapi'
import type { healthRoute } from '@fullstack-forge/api-spec/routes/health'
import { sql } from 'drizzle-orm'
import { db } from '~/db/client'

export const healthHandler: RouteHandler<typeof healthRoute> = async (c) => {
  await db.execute(sql`select 1`)
  return c.json({ status: 'ok' as const }, 200)
}
