import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    tsconfigPaths: true,
    conditions: ['@fullstack-forge/source'],
  },
  test: {
    name: 'design-system',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    css: true,
  },
})
