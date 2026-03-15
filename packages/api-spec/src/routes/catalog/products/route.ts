import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import {
  catalogErrorSchema,
  catalogProductDetailSchema,
  catalogProductListResponseSchema,
  catalogSearchResponseSchema,
  stockDisplaySchema,
} from '../../../catalog-schemas'

export const catalogCommonQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  isActive: z.stringbool().optional(),
  stockDisplay: stockDisplaySchema.optional(),
  brand: z.string().optional(),
})

export const catalogListQuerySchema = catalogCommonQuerySchema.extend({
  sort: z.enum(['latest', 'price', 'name']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().pipe(z.int().positive()).optional(),
  page_size: z.coerce.number().pipe(z.int().positive().max(100)).optional(),
})

export const catalogProductIdParamsSchema = z.object({
  id: z.uuid(),
})

export const getProductsRoute = createRoute({
  method: 'get',
  path: '/products',
  request: {
    query: catalogListQuerySchema,
  },
  responses: {
    200: {
      description: 'Catalog product list',
      content: {
        'application/json': {
          schema: catalogProductListResponseSchema,
        },
      },
    },
  },
})

export const getProductByIdRoute = createRoute({
  method: 'get',
  path: '/products/{id}',
  request: {
    params: catalogProductIdParamsSchema,
  },
  responses: {
    200: {
      description: 'Catalog product detail',
      content: {
        'application/json': {
          schema: catalogProductDetailSchema,
        },
      },
    },
    404: {
      description: 'Product not found',
      content: {
        'application/json': {
          schema: catalogErrorSchema,
        },
      },
    },
  },
})

export const searchProductsRoute = createRoute({
  method: 'get',
  path: '/products/search',
  request: {
    query: catalogListQuerySchema,
  },
  responses: {
    200: {
      description: 'Catalog product search results',
      content: {
        'application/json': {
          schema: catalogSearchResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid search query',
      content: {
        'application/json': {
          schema: catalogErrorSchema,
        },
      },
    },
  },
})
