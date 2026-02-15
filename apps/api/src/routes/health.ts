import { Hono } from 'hono'
import type { components } from '@fullstack-forge/api-spec/types'
import { sql } from 'drizzle-orm'
import { db } from '~/db/client'

type HealthResponse = components['schemas']['HealthResponse']

const healthRoute = new Hono()

healthRoute.get('/', async (c) => {
  await db.execute(sql`select 1`)
  return c.json({ status: 'ok' } satisfies HealthResponse)
})

export { healthRoute }
