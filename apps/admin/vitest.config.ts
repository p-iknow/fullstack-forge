import { defineProject } from 'vitest/config'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineProject({
  plugins: [tsConfigPaths()],
  resolve: {
    conditions: ['@fullstack-forge/source'],
  },
  test: {
    name: 'admin',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    css: true,
  },
})
