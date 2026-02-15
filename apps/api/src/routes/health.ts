import { Hono } from 'hono'
import type { components } from '@fullstack-forge/api-spec/types'

type HealthResponse = components['schemas']['HealthResponse']

const healthRoute = new Hono()

healthRoute.get('/', (c) => {
  return c.json({ status: 'ok' } satisfies HealthResponse)
})

export { healthRoute }
