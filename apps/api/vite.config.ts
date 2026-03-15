import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'
import build from '@hono/vite-build/node'
export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    throw new Error('This is a server-only project')
  }
  return {
    server: {
      port: 8080,
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      devServer({
        entry: 'src/index.ts',
      }),
      build({
        entry: 'src/index.ts',
        port: 8080,
      }),
    ],
  }
})
