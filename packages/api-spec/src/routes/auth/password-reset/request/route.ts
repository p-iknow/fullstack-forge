import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { authErrorSchema } from '../../../../auth-schemas'

export const passwordResetRequestRequestSchema = z.object({
  email: z.email(),
})

export const passwordResetRequestResponseSchema = z.object({
  ok: z.literal(true),
})

export const passwordResetRequestRoute = createRoute({
  method: 'post',
  path: '/password-reset/request',
  request: {
    body: {
      content: {
        'application/json': {
          schema: passwordResetRequestRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: passwordResetRequestResponseSchema,
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
