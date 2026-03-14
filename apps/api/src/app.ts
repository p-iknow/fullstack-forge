import { logger } from 'hono/logger'
import { handleAppError } from '~/lib/errors'
import { registerOpenApiDocument } from '~/lib/openapi'
import { createApp } from '~/lib/create-app'
import { adminIndex } from '~/routes/admin/admin.index'
import { authIndex } from '~/routes/auth/index'
import { catalogIndex } from '~/routes/catalog'
import { healthIndex } from '~/routes/health/health.index'

export const app = createApp()

app.use('*', logger())

app.onError(handleAppError)

app.route('/health', healthIndex)
app.route('/auth', authIndex)
app.route('/admin', adminIndex)
app.route('/', catalogIndex)

registerOpenApiDocument(app)
