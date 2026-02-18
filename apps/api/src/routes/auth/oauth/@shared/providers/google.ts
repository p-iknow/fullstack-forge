import type {
  OAuthCallbackInput,
  OAuthProfile,
  OAuthProviderAdapter,
} from '~/routes/auth/oauth/@shared/providers/types'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

type GoogleTokenResponse = {
  access_token: string
}

type GoogleUserInfoResponse = {
  sub: string
  email?: string
  name?: string
}

export const googleOAuthAdapter: OAuthProviderAdapter = {
  provider: 'google',
  buildAuthorizeUrl(input) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI
    if (!clientId || !redirectUri) {
      throw new Error('google oauth env is not configured')
    }

    const url = new URL(GOOGLE_AUTH_URL)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'openid email profile')
    url.searchParams.set('state', input.state)
    url.searchParams.set('nonce', input.nonce)
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent')
    return url
  },
  async exchangeCodeForProfile(input: OAuthCallbackInput): Promise<OAuthProfile> {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('google oauth env is not configured')
    }

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: input.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      throw new Error('google token exchange failed')
    }

    const tokenPayload = (await tokenRes.json()) as GoogleTokenResponse
    if (!tokenPayload.access_token) {
      throw new Error('google access token missing')
    }

    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        authorization: `Bearer ${tokenPayload.access_token}`,
      },
    })

    if (!profileRes.ok) {
      throw new Error('google userinfo request failed')
    }

    const profile = (await profileRes.json()) as GoogleUserInfoResponse
    if (!profile.sub || !profile.email) {
      throw new Error('google userinfo is missing required fields')
    }

    return {
      providerUserId: profile.sub,
      email: profile.email,
      name: profile.name ?? profile.email,
    }
  },
}
