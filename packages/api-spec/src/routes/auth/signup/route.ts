import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { authErrorSchema, authUserSchema } from '../../../auth-schemas'

export const signupRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

export const signupResponseSchema = z.object({
  user: authUserSchema,
})

export const signupRoute = createRoute({
  method: 'post',
  path: '/signup',
  request: {
    body: {
      content: {
        'application/json': {
          schema: signupRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created',
      content: {
        'application/json': {
          schema: signupResponseSchema,
        },
      },
    },
    409: {
      description: 'Conflict',
      content: {
        'application/json': {
          schema: authErrorSchema,
        },
      },
    },
  },
})
