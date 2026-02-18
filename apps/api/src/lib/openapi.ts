import type { OpenAPIHono } from '@hono/zod-openapi'

export const registerOpenApiDocument = (app: OpenAPIHono) => {
  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'Fullstack Forge API',
      version: '1.0.0',
    },
  })
}
