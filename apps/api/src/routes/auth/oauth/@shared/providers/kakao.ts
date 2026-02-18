import type {
  OAuthCallbackInput,
  OAuthProfile,
  OAuthProviderAdapter,
} from '~/routes/auth/oauth/@shared/providers/types'

const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize'
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token'
const KAKAO_USERINFO_URL = 'https://kapi.kakao.com/v2/user/me'

type KakaoTokenResponse = {
  access_token: string
}

type KakaoUserInfoResponse = {
  id: number
  kakao_account?: {
    email?: string
    profile?: {
      nickname?: string
    }
  }
}

export const kakaoOAuthAdapter: OAuthProviderAdapter = {
  provider: 'kakao',
  buildAuthorizeUrl(input) {
    const clientId = process.env.KAKAO_CLIENT_ID
    const redirectUri = process.env.KAKAO_OAUTH_REDIRECT_URI
    if (!clientId || !redirectUri) {
      throw new Error('kakao oauth env is not configured')
    }

    const url = new URL(KAKAO_AUTH_URL)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'profile_nickname account_email')
    url.searchParams.set('state', input.state)
    url.searchParams.set('nonce', input.nonce)
    return url
  },
  async exchangeCodeForProfile(input: OAuthCallbackInput): Promise<OAuthProfile> {
    const clientId = process.env.KAKAO_CLIENT_ID
    const clientSecret = process.env.KAKAO_CLIENT_SECRET
    const redirectUri = process.env.KAKAO_OAUTH_REDIRECT_URI
    if (!clientId || !redirectUri) {
      throw new Error('kakao oauth env is not configured')
    }

    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      client_id: clientId,
      redirect_uri: redirectUri,
    })
    if (clientSecret) {
      form.set('client_secret', clientSecret)
    }

    const tokenRes = await fetch(KAKAO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: form,
    })

    if (!tokenRes.ok) {
      throw new Error('kakao token exchange failed')
    }

    const tokenPayload = (await tokenRes.json()) as KakaoTokenResponse
    if (!tokenPayload.access_token) {
      throw new Error('kakao access token missing')
    }

    const profileRes = await fetch(KAKAO_USERINFO_URL, {
      headers: {
        authorization: `Bearer ${tokenPayload.access_token}`,
      },
    })

    if (!profileRes.ok) {
      throw new Error('kakao userinfo request failed')
    }

    const profile = (await profileRes.json()) as KakaoUserInfoResponse
    const email = profile.kakao_account?.email
    if (!profile.id || !email) {
      throw new Error('kakao userinfo is missing required fields')
    }

    return {
      providerUserId: String(profile.id),
      email,
      name: profile.kakao_account?.profile?.nickname ?? email,
    }
  },
}
