import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { authErrorSchema } from '../../../auth-schemas'

export const adminRedriveResponseSchema = z.object({
  ok: z.literal(true),
  action: z.literal('redrive_started'),
  requestedBy: z.string().nullable(),
})

export const adminRedriveRoute = createRoute({
  method: 'post',
  path: '/redrive',
  responses: {
    200: {
      description: 'Redrive requested',
      content: {
        'application/json': {
          schema: adminRedriveResponseSchema,
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
