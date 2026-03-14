import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { catalogCategorySchema } from '../../../catalog-schemas'

export const getCategoriesRoute = createRoute({
  method: 'get',
  path: '/categories',
  responses: {
    200: {
      description: 'Catalog category list',
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(catalogCategorySchema),
          }),
        },
      },
    },
  },
})
