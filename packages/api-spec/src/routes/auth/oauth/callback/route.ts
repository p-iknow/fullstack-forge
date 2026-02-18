import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { oauthErrorSchema } from '../../../../oauth-schemas'

export const oauthCallbackParamsSchema = z.object({
  provider: z.enum(['google', 'kakao']),
})

export const oauthCallbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
})

export const oauthCallbackRoute = createRoute({
  method: 'get',
  path: '/oauth/{provider}/callback',
  request: {
    params: oauthCallbackParamsSchema,
    query: oauthCallbackQuerySchema,
  },
  responses: {
    302: {
      description: 'Redirect to callback success page',
    },
    400: {
      description: 'Invalid oauth state',
      content: {
        'application/json': {
          schema: oauthErrorSchema,
        },
      },
    },
    401: {
      description: 'OAuth exchange failed',
      content: {
        'application/json': {
          schema: oauthErrorSchema,
        },
      },
    },
  },
})
