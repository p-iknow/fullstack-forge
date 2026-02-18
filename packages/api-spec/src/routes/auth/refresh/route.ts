import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { authErrorSchema } from '../../../auth-schemas'

export const refreshResponseSchema = z.object({
  ok: z.literal(true),
})

export const refreshRoute = createRoute({
  method: 'post',
  path: '/refresh',
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: refreshResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: authErrorSchema,
        },
      },
    },
  },
})
