import { googleOAuthAdapter } from '~/routes/auth/oauth/@shared/providers/google'
import { kakaoOAuthAdapter } from '~/routes/auth/oauth/@shared/providers/kakao'
import type {
  OAuthProvider,
  OAuthProviderAdapter,
} from '~/routes/auth/oauth/@shared/providers/types'

const oauthProviderAdapters: Record<OAuthProvider, OAuthProviderAdapter> = {
  google: googleOAuthAdapter,
  kakao: kakaoOAuthAdapter,
}

export const isOAuthProvider = (value: string): value is OAuthProvider =>
  value === 'google' || value === 'kakao'

export const getOAuthProviderAdapter = (provider: OAuthProvider): OAuthProviderAdapter =>
  oauthProviderAdapters[provider]
