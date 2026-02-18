import '@testing-library/jest-dom/vitest'
// Tests don't go through the app root route stylesheet link, so load it here.
import '~/styles/app.css'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { worker } from '~/test/msw/browser'

beforeAll(async () => {
  await worker.start({
    onUnhandledRequest: 'error',
    quiet: true,
  })
})

afterEach(() => {
  worker.resetHandlers()
})

afterAll(() => {
  worker.stop()
})
