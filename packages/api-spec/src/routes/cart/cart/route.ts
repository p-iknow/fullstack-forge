import { createRoute } from '@hono/zod-openapi'
import { authErrorSchema } from '../../../auth-schemas'
import { cartErrorSchema, cartResponseSchema } from '../../../cart-schemas'

export const getCartRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'Active cart with items',
      content: {
        'application/json': {
          schema: cartResponseSchema,
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

export const clearCartRoute = createRoute({
  method: 'delete',
  path: '/',
  responses: {
    204: {
      description: 'Cart cleared',
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: authErrorSchema,
        },
      },
    },
    409: {
      description: 'Cart not active',
      content: {
        'application/json': {
          schema: cartErrorSchema,
        },
      },
    },
  },
})
