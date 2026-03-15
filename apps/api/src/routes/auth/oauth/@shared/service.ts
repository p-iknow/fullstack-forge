import { and, eq } from 'drizzle-orm'
import { db } from '~/db/client'
import { userOauthAccounts, users } from '~/db/schema/index'

type OAuthIdentityInput = {
  provider: 'google' | 'kakao'
  providerUserId: string
  email: string
  name: string
}

const DEFAULT_STORE_ORIGIN = 'http://localhost:3000'

export const upsertOAuthIdentity = async (input: OAuthIdentityInput): Promise<string> => {
  const [oauthAccount] = await db
    .select({ userId: userOauthAccounts.userId })
    .from(userOauthAccounts)
    .where(
      and(
        eq(userOauthAccounts.provider, input.provider),
        eq(userOauthAccounts.providerUserId, input.providerUserId),
      ),
    )
    .limit(1)

  if (oauthAccount) {
    return oauthAccount.userId
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1)

  let userId = existingUser?.id
  if (!userId) {
    const [createdUser] = await db
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
      })
      .returning({ id: users.id })

    userId = createdUser.id
  }

  await db.insert(userOauthAccounts).values({
    userId,
    provider: input.provider,
    providerUserId: input.providerUserId,
    email: input.email,
  })

  return userId
}

export const resolveAllowedRedirectPath = (rawPath: string | undefined): string => {
  const fallbackPath = '/'
  if (!rawPath || !rawPath.startsWith('/')) {
    return resolveFrontendRedirectUrl(fallbackPath)
  }

  const allowlist = getOAuthRedirectAllowlist(fallbackPath)
  if (!allowlist.has(rawPath)) {
    return resolveFrontendRedirectUrl(fallbackPath)
  }

  return resolveFrontendRedirectUrl(rawPath)
}

const getOAuthRedirectAllowlist = (defaultPath: string): Set<string> => {
  const allowlistRaw = process.env.OAUTH_REDIRECT_ALLOWLIST
  const allowlist = new Set<string>()
  if (allowlistRaw) {
    for (const candidate of allowlistRaw.split(',').map((value) => value.trim())) {
      if (candidate.startsWith('/')) {
        allowlist.add(candidate)
      }
    }
  }

  allowlist.add(defaultPath)
  allowlist.add('/')
  return allowlist
}

export const resolveFrontendRedirectUrl = (value: string): string => {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  const storeOrigin =
    process.env.STORE_ORIGIN?.trim() || process.env.FRONTEND_ORIGIN?.trim() || DEFAULT_STORE_ORIGIN
  return new URL(value, storeOrigin).toString()
}
