import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { getAuthMeQueryKey } from '@fullstack-forge/api-spec/client/auth/@tanstack/react-query.gen'
import {
  getAuthMe,
  postAuthLogin,
  postAuthLogout,
} from '@fullstack-forge/api-spec/client/auth/sdk.gen'
import type {
  GetAuthMeResponse,
  PostAuthLoginData,
  PostAuthLoginResponse,
} from '@fullstack-forge/api-spec/client/auth/types.gen'
import { ApiClientError } from '~/lib/api/core'
import { authClient } from '~/lib/api/generated-client'

export type LoginInput = NonNullable<PostAuthLoginData['body']>
export type LoginResponse = PostAuthLoginResponse
export type MeResponse = GetAuthMeResponse
export type AuthUser = LoginResponse['user']

export const authQueryKeys = {
  me: getAuthMeQueryKey({ client: authClient }),
  login: ['auth', 'login'] as const,
  logout: ['auth', 'logout'] as const,
}

export const meQueryOptions = (initialData: MeResponse | null | undefined = undefined) =>
  queryOptions({
    queryKey: authQueryKeys.me,
    queryFn: async (): Promise<MeResponse | null> => {
      const { data, error, response } = await getAuthMe({
        client: authClient,
        throwOnError: false,
      })

      if (!response) {
        throw new ApiClientError({ error: 'Network request failed' })
      }

      if (response.status === 401) {
        return null
      }

      if (!data || error) {
        throw new ApiClientError({
          error: 'Failed to load session',
        })
      }

      return data
    },
    staleTime: 30_000,
    retry: false,
    ...(initialData === undefined ? {} : { initialData }),
  })

export const loginMutationOptions = () =>
  mutationOptions({
    mutationKey: authQueryKeys.login,
    mutationFn: async (input: LoginInput) => {
      const { data, error } = await postAuthLogin({
        body: input,
        client: authClient,
        throwOnError: false,
      })
      if (error) {
        const parsed = parseAuthErrorPayload(error)
        if (parsed) {
          throw new ApiClientError(parsed, 'Login failed')
        }
        throw new ApiClientError({ error: 'Login failed' })
      }
      if (!data) {
        throw new ApiClientError({ error: 'Login failed' })
      }
      return data
    },
  })

export const logoutMutationOptions = () =>
  mutationOptions({
    mutationKey: authQueryKeys.logout,
    mutationFn: async () => {
      const { error } = await postAuthLogout({
        client: authClient,
        throwOnError: false,
      })
      if (error) {
        throw new ApiClientError({ error: 'Failed to log out' })
      }
    },
  })

function parseAuthErrorPayload(error: unknown): { code?: string; error?: string } | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  const payload = error as Record<string, unknown>
  const code = typeof payload.code === 'string' ? payload.code : undefined
  const message = typeof payload.error === 'string' ? payload.error : undefined

  if (!code && !message) {
    return null
  }

  return {
    code,
    error: message,
  }
}
