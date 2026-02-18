import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { authErrorSchema } from '../../../auth-schemas'

export const logoutResponseSchema = z.object({
  ok: z.literal(true),
})

export const logoutRoute = createRoute({
  method: 'post',
  path: '/logout',
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: logoutResponseSchema,
        },
      },
    },
    429: {
      description: 'Too Many Requests',
      content: {
        'application/json': {
          schema: authErrorSchema,
        },
      },
    },
  },
})
