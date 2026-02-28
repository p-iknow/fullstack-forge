import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import {
  adminCatalogErrorSchema,
  adminProductImageResponseSchema,
  adminProductResponseSchema,
  createProductRequestSchema,
  updateProductRequestSchema,
  updateProductStatusRequestSchema,
} from '../../../admin-catalog-schemas'
import { authErrorSchema } from '../../../auth-schemas'

export const adminProductIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export const createAdminProductRoute = createRoute({
  method: 'post',
  path: '/products',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createProductRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Product created',
      content: { 'application/json': { schema: adminProductResponseSchema } },
    },
    400: {
      description: 'Invalid input',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: authErrorSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: authErrorSchema } },
    },
    409: {
      description: 'Product name conflict',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
  },
})

export const updateAdminProductRoute = createRoute({
  method: 'patch',
  path: '/products/{id}',
  request: {
    params: adminProductIdParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateProductRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Product updated',
      content: { 'application/json': { schema: adminProductResponseSchema } },
    },
    400: {
      description: 'Invalid input',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: authErrorSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: authErrorSchema } },
    },
    404: {
      description: 'Product not found',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
  },
})

export const updateAdminProductStatusRoute = createRoute({
  method: 'patch',
  path: '/products/{id}/status',
  request: {
    params: adminProductIdParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateProductStatusRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Product status updated',
      content: { 'application/json': { schema: adminProductResponseSchema } },
    },
    400: {
      description: 'Invalid status',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: authErrorSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: authErrorSchema } },
    },
    404: {
      description: 'Product not found',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
  },
})

export const deleteAdminProductRoute = createRoute({
  method: 'delete',
  path: '/products/{id}',
  request: {
    params: adminProductIdParamsSchema,
  },
  responses: {
    204: {
      description: 'Product deleted',
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: authErrorSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: authErrorSchema } },
    },
    404: {
      description: 'Product not found',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
    409: {
      description: 'Product has orders',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
  },
})

export const uploadAdminProductImagesRoute = createRoute({
  method: 'post',
  path: '/products/{id}/images',
  request: {
    params: adminProductIdParamsSchema,
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            thumb: z.instanceof(File).openapi({ type: 'string', format: 'binary' }),
            detail: z.instanceof(File).openapi({ type: 'string', format: 'binary' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Images uploaded',
      content: { 'application/json': { schema: adminProductImageResponseSchema } },
    },
    400: {
      description: 'Invalid file',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: authErrorSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: authErrorSchema } },
    },
    404: {
      description: 'Product not found',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
  },
})
