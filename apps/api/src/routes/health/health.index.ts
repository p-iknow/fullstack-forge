import { createRouter } from '~/lib/create-app'
import { healthRoute } from '@fullstack-forge/api-spec/routes/health'
import { healthHandler } from './handler'

export const healthIndex = createRouter()

healthIndex.openapi(healthRoute, healthHandler)
