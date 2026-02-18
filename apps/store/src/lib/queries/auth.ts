import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { getAuthMeQueryKey } from '@fullstack-forge/api-spec/client/auth/@tanstack/react-query.gen'
import {
  getAuthMe,
  postAuthLogin,
  postAuthLogout,
  postAuthSignup,
} from '@fullstack-forge/api-spec/client/auth/sdk.gen'
import type {
  GetAuthMeResponse,
  PostAuthLoginData,
  PostAuthLoginResponse,
  PostAuthSignupData,
  PostAuthSignupResponse,
} from '@fullstack-forge/api-spec/client/auth/types.gen'
import { ApiClientError } from '~/lib/api/core'
import { authClient } from '~/lib/api/generated-client'

export type LoginInput = NonNullable<PostAuthLoginData['body']>
export type SignupInput = NonNullable<PostAuthSignupData['body']>
export type LoginResponse = PostAuthLoginResponse
export type SignupResponse = PostAuthSignupResponse
export type MeResponse = GetAuthMeResponse
export type AuthUser = LoginResponse['user']

const AUTH_HINT_COOKIE_NAME = 'qc_auth_hint'
const generatedMeQueryKey = getAuthMeQueryKey({ client: authClient })

export const authQueryKeys = {
  me: generatedMeQueryKey,
  login: ['auth', 'login'] as const,
  signup: ['auth', 'signup'] as const,
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

export function resolveMeInitialDataFromAuthHint(): MeResponse | null | undefined {
  if (typeof document === 'undefined') {
    return undefined
  }

  const cookieValue = readCookie(AUTH_HINT_COOKIE_NAME)
  if (!cookieValue) {
    return null
  }

  const expiresAt = Number.parseInt(cookieValue, 10)
  if (!Number.isFinite(expiresAt)) {
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  if (expiresAt <= now) {
    return null
  }

  return undefined
}

function readCookie(name: string): string | null {
  const cookies = document.cookie.split(';')
  const prefix = `${encodeURIComponent(name)}=`
  for (const entry of cookies) {
    const cookie = entry.trim()
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length))
    }
  }

  return null
}

export const loginMutationOptions = () =>
  mutationOptions({
    mutationKey: authQueryKeys.login,
    mutationFn: async (input: LoginInput) => {
      const { data, error } = await postAuthLogin({
        body: input,
        client: authClient,
        throwOnError: false,
      })
      if (!data || error) {
        throw new ApiClientError({ error: 'Login failed' })
      }
      return data
    },
  })

export const signupMutationOptions = () =>
  mutationOptions({
    mutationKey: authQueryKeys.signup,
    mutationFn: async (input: SignupInput) => {
      const { data, error } = await postAuthSignup({
        body: input,
        client: authClient,
        throwOnError: false,
      })
      if (!data || error) {
        throw new ApiClientError({ error: 'Sign up failed' })
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
