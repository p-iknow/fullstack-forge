import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsConfigPaths()],
  resolve: {
    conditions: ['@fullstack-forge/source'],
  },
  test: {
    name: 'store',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    css: true,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
