import '@testing-library/jest-dom/vitest'
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
