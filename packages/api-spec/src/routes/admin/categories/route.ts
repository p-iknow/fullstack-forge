import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import {
  adminCatalogErrorSchema,
  adminCategoryListResponseSchema,
  adminCategorySchema,
  createCategoryRequestSchema,
  updateCategoryRequestSchema,
} from '../../../admin-catalog-schemas'
import { authErrorSchema } from '../../../auth-schemas'

export const adminCategoryIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export const getAdminCategoriesRoute = createRoute({
  method: 'get',
  path: '/categories',
  responses: {
    200: {
      description: 'Admin category list',
      content: {
        'application/json': {
          schema: adminCategoryListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: authErrorSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: authErrorSchema } },
    },
  },
})

export const createAdminCategoryRoute = createRoute({
  method: 'post',
  path: '/categories',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createCategoryRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Category created',
      content: { 'application/json': { schema: adminCategorySchema } },
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
      description: 'Slug already exists',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
  },
})

export const updateAdminCategoryRoute = createRoute({
  method: 'put',
  path: '/categories/{id}',
  request: {
    params: adminCategoryIdParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateCategoryRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Category updated',
      content: { 'application/json': { schema: adminCategorySchema } },
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
      description: 'Category not found',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
    409: {
      description: 'Slug already exists',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
  },
})

export const deleteAdminCategoryRoute = createRoute({
  method: 'delete',
  path: '/categories/{id}',
  request: {
    params: adminCategoryIdParamsSchema,
  },
  responses: {
    204: {
      description: 'Category deleted',
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
      description: 'Category not found',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
    409: {
      description: 'Category has products',
      content: { 'application/json': { schema: adminCatalogErrorSchema } },
    },
  },
})
