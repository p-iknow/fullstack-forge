export const oauthProviders = ['google', 'kakao'] as const

export type OAuthProvider = (typeof oauthProviders)[number]

export type OAuthError = {
  code: string
  error: string
}
