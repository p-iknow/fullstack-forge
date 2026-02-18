import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { authErrorSchema, authUserSchema } from '../../../auth-schemas'

export const meResponseSchema = z.object({
  user: authUserSchema,
})

export const meRoute = createRoute({
  method: 'get',
  path: '/me',
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: meResponseSchema,
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
