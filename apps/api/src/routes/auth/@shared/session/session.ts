import { and, eq } from 'drizzle-orm'
import { db } from '~/db/client'
import { userSessions } from '~/db/schema/index'
import { REFRESH_TOKEN_TTL_SECONDS } from '~/routes/auth/@shared/config/constants'
import {
  createOpaqueToken,
  hashToken,
  signAccessToken,
  verifyAccessToken,
} from '~/routes/auth/@shared/session/tokens'

type AccessPayload = {
  userId: string
  sessionId: string
}

type SessionTokens = {
  accessToken: string
  refreshToken: string
  sessionId: string
}

type RotationResult =
  | ({ kind: 'ok'; userId: string } & SessionTokens)
  | { kind: 'invalid' }
  | { kind: 'expired'; userId: string }
  | { kind: 'reuse_detected'; userId: string }

const resolveExpiryDate = (ttlSeconds: number): Date => new Date(Date.now() + ttlSeconds * 1000)

export const createSession = async (userId: string): Promise<SessionTokens> => {
  const refreshToken = createOpaqueToken()
  const refreshTokenHash = hashToken(refreshToken)
  const expiresAt = resolveExpiryDate(REFRESH_TOKEN_TTL_SECONDS)

  const [session] = await db
    .insert(userSessions)
    .values({
      userId,
      refreshTokenHash,
      expiresAt,
      revoked: false,
    })
    .returning({ id: userSessions.id })

  const accessToken = signAccessToken(userId, session.id)

  return {
    accessToken,
    refreshToken,
    sessionId: session.id,
  }
}

const getAccessPayload = async (accessToken: string): Promise<AccessPayload | null> => {
  const payload = verifyAccessToken(accessToken)
  if (!payload) {
    return null
  }

  return {
    userId: payload.userId,
    sessionId: payload.sessionId,
  }
}

export const getAuthenticatedSession = async (
  accessToken: string,
): Promise<{ userId: string; sessionId: string } | null> => {
  const payload = await getAccessPayload(accessToken)
  if (!payload) {
    return null
  }

  return payload
}

export const revokeSession = async (sessionId: string): Promise<void> => {
  await db.update(userSessions).set({ revoked: true }).where(eq(userSessions.id, sessionId))
}

const revokeSessionsByUser = async (userId: string): Promise<void> => {
  const sessions = await db
    .select({ id: userSessions.id })
    .from(userSessions)
    .where(and(eq(userSessions.userId, userId), eq(userSessions.revoked, false)))

  for (const session of sessions) {
    await revokeSession(session.id)
  }
}

export const revokeByRefreshToken = async (refreshToken: string): Promise<string | null> => {
  const refreshTokenHash = hashToken(refreshToken)
  const [session] = await db
    .select({ id: userSessions.id, userId: userSessions.userId })
    .from(userSessions)
    .where(eq(userSessions.refreshTokenHash, refreshTokenHash))
    .limit(1)

  if (!session) {
    return null
  }

  await revokeSession(session.id)
  return session.userId
}

export const rotateRefreshToken = async (refreshToken: string): Promise<RotationResult> => {
  const refreshTokenHash = hashToken(refreshToken)
  const [session] = await db
    .select({
      id: userSessions.id,
      userId: userSessions.userId,
      revoked: userSessions.revoked,
      expiresAt: userSessions.expiresAt,
    })
    .from(userSessions)
    .where(eq(userSessions.refreshTokenHash, refreshTokenHash))
    .limit(1)

  if (!session) {
    return { kind: 'invalid' }
  }

  if (session.revoked) {
    await revokeSessionsByUser(session.userId)
    return { kind: 'reuse_detected', userId: session.userId }
  }

  if (session.expiresAt <= new Date()) {
    await revokeSession(session.id)
    return { kind: 'expired', userId: session.userId }
  }

  await revokeSession(session.id)
  const next = await createSession(session.userId)

  return {
    kind: 'ok',
    userId: session.userId,
    accessToken: next.accessToken,
    refreshToken: next.refreshToken,
    sessionId: next.sessionId,
  }
}
