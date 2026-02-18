import { client } from '@fullstack-forge/api-spec/client/auth/client.gen'

client.setConfig({
  baseUrl: '/api',
  credentials: 'include',
  timeout: 10_000,
  retry: { limit: 1 },
})

export const authClient = client
