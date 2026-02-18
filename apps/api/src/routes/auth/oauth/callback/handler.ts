import type { RouteHandler } from '@hono/zod-openapi'
import { oauthCallbackRoute } from '@fullstack-forge/api-spec/routes/auth'
import { logAuditEvent } from '~/routes/auth/@shared/audit/audit'
import { getRequestMeta, setAuthCookies } from '~/routes/auth/@shared/http/service'
import { createSession } from '~/routes/auth/@shared/session/session'
import { getOAuthProviderAdapter, isOAuthProvider } from '~/routes/auth/oauth/@shared/providers'
import { consumeOAuthState } from '~/routes/auth/oauth/@shared/state'
import {
  resolveFrontendRedirectUrl,
  upsertOAuthIdentity,
} from '~/routes/auth/oauth/@shared/service'

export const oauthCallbackHandler: RouteHandler<typeof oauthCallbackRoute> = async (c) => {
  const { provider } = c.req.valid('param')
  const { code, state } = c.req.valid('query')

  if (!isOAuthProvider(provider)) {
    return c.json({ code: 'oauth_provider_unavailable', error: 'Unsupported oauth provider' }, 400)
  }

  const requestMeta = getRequestMeta(c)
  const consumedState = await consumeOAuthState(state)
  if (!consumedState || consumedState.provider !== provider) {
    await logAuditEvent({
      event: 'oauth_callback_failed',
      userId: null,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      requestId: requestMeta.requestId,
      provider,
      resultCode: 'oauth_invalid_state',
    })
    return c.json({ code: 'oauth_invalid_state', error: 'Invalid oauth state' }, 400)
  }

  let userId: string | null = null

  try {
    const adapter = getOAuthProviderAdapter(provider)
    const profile = await adapter.exchangeCodeForProfile({
      code,
      nonce: consumedState.nonce,
    })

    const resolvedUserId = await upsertOAuthIdentity({
      provider,
      providerUserId: profile.providerUserId,
      email: profile.email,
      name: profile.name,
    })
    userId = resolvedUserId

    const session = await createSession(resolvedUserId)
    setAuthCookies(c, session.accessToken, session.refreshToken)

    await logAuditEvent({
      event: 'oauth_callback_success',
      userId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      requestId: requestMeta.requestId,
      provider,
      resultCode: 'ok',
    })

    return c.redirect(resolveFrontendRedirectUrl(consumedState.redirectPath), 302)
  } catch {
    await logAuditEvent({
      event: 'oauth_callback_failed',
      userId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      requestId: requestMeta.requestId,
      provider,
      resultCode: 'oauth_exchange_failed',
    })
    return c.json({ code: 'oauth_exchange_failed', error: 'OAuth exchange failed' }, 401)
  }
}
