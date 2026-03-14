import { createRoute } from '@hono/zod-openapi'
import { authErrorSchema } from '../../../auth-schemas'
import {
  addCartItemRequestSchema,
  cartErrorSchema,
  cartItemIdParamsSchema,
  cartResponseSchema,
  updateCartItemRequestSchema,
} from '../../../cart-schemas'

export const addCartItemRoute = createRoute({
  method: 'post',
  path: '/items',
  request: {
    body: {
      content: {
        'application/json': {
          schema: addCartItemRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Item added to cart',
      content: {
        'application/json': {
          schema: cartResponseSchema,
        },
      },
    },
    400: {
      description: 'Quantity exceeded or max items exceeded',
      content: {
        'application/json': {
          schema: cartErrorSchema,
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
    409: {
      description: 'Cart not active or version conflict',
      content: {
        'application/json': {
          schema: cartErrorSchema,
        },
      },
    },
    422: {
      description: 'Product unavailable',
      content: {
        'application/json': {
          schema: cartErrorSchema,
        },
      },
    },
  },
})

export const updateCartItemRoute = createRoute({
  method: 'patch',
  path: '/items/{cartItemId}',
  request: {
    params: cartItemIdParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateCartItemRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Cart item quantity updated',
      content: {
        'application/json': {
          schema: cartResponseSchema,
        },
      },
    },
    400: {
      description: 'Quantity exceeded',
      content: {
        'application/json': {
          schema: cartErrorSchema,
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
    404: {
      description: 'Item not found',
      content: {
        'application/json': {
          schema: cartErrorSchema,
        },
      },
    },
    409: {
      description: 'Cart not active or version conflict',
      content: {
        'application/json': {
          schema: cartErrorSchema,
        },
      },
    },
  },
})

export const deleteCartItemRoute = createRoute({
  method: 'delete',
  path: '/items/{cartItemId}',
  request: {
    params: cartItemIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Cart item removed',
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
    404: {
      description: 'Item not found',
      content: {
        'application/json': {
          schema: cartErrorSchema,
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
