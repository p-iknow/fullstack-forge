import type { RouteHandler } from '@hono/zod-openapi'
import { oauthStartRoute } from '@fullstack-forge/api-spec/routes/auth'
import { logAuditEvent } from '~/routes/auth/@shared/audit/audit'
import { getRequestMeta } from '~/routes/auth/@shared/http/service'
import { enforceOAuthStartRateLimit } from '~/routes/auth/@shared/security/rate-limit'
import { createOpaqueToken } from '~/routes/auth/@shared/session/tokens'
import { getOAuthProviderAdapter, isOAuthProvider } from '~/routes/auth/oauth/@shared/providers'
import { createOAuthState } from '~/routes/auth/oauth/@shared/state'
import { resolveAllowedRedirectPath } from '~/routes/auth/oauth/@shared/service'

export const oauthStartHandler: RouteHandler<typeof oauthStartRoute> = async (c) => {
  const { provider } = c.req.valid('param')
  const { redirect } = c.req.valid('query')

  if (!isOAuthProvider(provider)) {
    return c.json({ code: 'oauth_provider_unavailable', error: 'Unsupported oauth provider' }, 400)
  }

  const adapter = getOAuthProviderAdapter(provider)
  const requestMeta = getRequestMeta(c)
  const oauthStartRateLimit = await enforceOAuthStartRateLimit(
    c,
    requestMeta.ipAddress ?? 'unknown',
  )
  if (oauthStartRateLimit.limited) {
    return c.json({ code: 'auth_rate_limited', error: 'Too many requests' }, 429)
  }

  const redirectPath = resolveAllowedRedirectPath(redirect)
  const nonce = createOpaqueToken()
  const oauthState = await createOAuthState({
    provider,
    nonce,
    redirectPath,
  })

  await logAuditEvent({
    event: 'oauth_start',
    userId: null,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
    requestId: requestMeta.requestId,
    provider,
    resultCode: 'ok',
  })

  const authorizeUrl = adapter.buildAuthorizeUrl({
    state: oauthState.state,
    nonce,
  })

  return c.redirect(authorizeUrl.toString(), 302)
}
