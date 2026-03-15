import {
  getDlqMessagesRoute,
  redriveAllRoute,
  redriveSingleRoute,
} from '@fullstack-forge/api-spec/routes/events'
import { createRouter } from '~/lib/create-app'
import { requireAuth } from '~/routes/auth/@shared/http/middleware'
import { getDlqMessagesHandler, redriveAllHandler, redriveSingleHandler } from './handlers'

export const eventsIndex = createRouter()
eventsIndex.use('*', requireAuth)
eventsIndex.openapi(getDlqMessagesRoute, getDlqMessagesHandler)
eventsIndex.openapi(redriveAllRoute, redriveAllHandler)
eventsIndex.openapi(redriveSingleRoute, redriveSingleHandler)
