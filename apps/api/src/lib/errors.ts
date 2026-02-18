import type { Context } from 'hono'

export const handleAppError = (err: unknown, c: Context) => {
  // eslint-disable-next-line no-console
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
}
