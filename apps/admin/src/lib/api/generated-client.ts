import { client } from '@fullstack-forge/api-spec/client/auth/client.gen'
import { refreshAccessToken } from '~/lib/api/core'

client.setConfig({
  baseUrl: '/api',
  credentials: 'include',
  timeout: 10_000,
  retry: { limit: 1 },
})

client.interceptors.response.use(async (response, request) => {
  if (response.status !== 401 || request.url.includes('/auth/refresh')) {
    return response
  }

  const refreshed = await refreshAccessToken()
  if (!refreshed) {
    return response
  }

  return fetch(request.url, {
    method: request.method,
    headers: request.headers,
    credentials: 'include',
  })
})

export const authClient = client
