import { db } from '~/db/client'
import { auditLogs, oauthProviderEnum } from '~/db/schema/index'

export type AuditEvent =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'session_revoked'
  | 'signup_success'
  | 'oauth_start'
  | 'oauth_callback_success'
  | 'oauth_callback_failed'

type OAuthProvider = (typeof oauthProviderEnum.enumValues)[number]

type AuditInput = {
  event: AuditEvent
  userId: string | null
  ipAddress: string | null
  userAgent: string | null
  requestId: string
  provider?: OAuthProvider
  resultCode?: string
}

export const logAuditEvent = async (input: AuditInput): Promise<void> => {
  await db.insert(auditLogs).values({
    event: input.event,
    userId: input.userId,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    requestId: input.requestId,
    provider: input.provider,
    resultCode: input.resultCode,
  })
}
