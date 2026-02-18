export type OAuthProvider = 'google' | 'kakao'

export type OAuthAuthorizeInput = {
  state: string
  nonce: string
}

export type OAuthProfile = {
  providerUserId: string
  email: string
  name: string
}

export type OAuthCallbackInput = {
  code: string
  nonce: string
}

export type OAuthProviderAdapter = {
  provider: OAuthProvider
  buildAuthorizeUrl(input: OAuthAuthorizeInput): URL
  exchangeCodeForProfile(input: OAuthCallbackInput): Promise<OAuthProfile>
}
