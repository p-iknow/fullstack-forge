import { OpenAPIHono } from '@hono/zod-openapi'

export const createRouter = () => new OpenAPIHono()

export const createApp = () => new OpenAPIHono()
