import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { healthRoute } from '~/routes/health'

const app = new Hono()

app.use('*', logger())

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.route('/health', healthRoute)

export { app }
