import { defineProject } from 'vitest/config'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineProject({
  plugins: [tsConfigPaths()],
  test: {
    name: 'api',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
