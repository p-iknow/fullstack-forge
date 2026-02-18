import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { oauthErrorSchema } from '../../../../oauth-schemas'

export const oauthStartParamsSchema = z.object({
  provider: z.enum(['google', 'kakao']),
})

export const oauthStartQuerySchema = z.object({
  redirect: z.string().optional(),
})

export const oauthStartRoute = createRoute({
  method: 'get',
  path: '/oauth/{provider}/start',
  request: {
    params: oauthStartParamsSchema,
    query: oauthStartQuerySchema,
  },
  responses: {
    302: {
      description: 'Redirect to oauth provider',
    },
    429: {
      description: 'Too Many Requests',
      content: {
        'application/json': {
          schema: oauthErrorSchema,
        },
      },
    },
  },
})
