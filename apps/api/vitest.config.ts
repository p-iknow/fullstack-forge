import { defineProject } from 'vitest/config'

export default defineProject({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'api',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
