import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { worker } from '~/test/msw/server'

beforeAll(() => {
  worker.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  worker.resetHandlers()
})

afterAll(() => {
  worker.close()
})
