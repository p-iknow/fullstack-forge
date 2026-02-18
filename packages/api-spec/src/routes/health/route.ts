import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
})

export const healthRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'API is healthy',
      content: {
        'application/json': {
          schema: healthResponseSchema,
        },
      },
    },
  },
})
