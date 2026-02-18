import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { authErrorSchema } from '../../../../auth-schemas'

export const passwordResetConfirmRequestSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export const passwordResetConfirmResponseSchema = z.object({
  ok: z.literal(true),
})

export const passwordResetConfirmRoute = createRoute({
  method: 'post',
  path: '/password-reset/confirm',
  request: {
    body: {
      content: {
        'application/json': {
          schema: passwordResetConfirmRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: passwordResetConfirmResponseSchema,
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
