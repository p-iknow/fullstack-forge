import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { authErrorSchema } from '../../../auth-schemas'

export const adminDashboardResponseSchema = z.object({
  ok: z.literal(true),
  role: z.enum(['customer', 'operator', 'admin']).nullable(),
})

export const adminDashboardRoute = createRoute({
  method: 'get',
  path: '/dashboard',
  responses: {
    200: {
      description: 'Admin dashboard access status',
      content: {
        'application/json': {
          schema: adminDashboardResponseSchema,
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
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: authErrorSchema,
        },
      },
    },
  },
})
