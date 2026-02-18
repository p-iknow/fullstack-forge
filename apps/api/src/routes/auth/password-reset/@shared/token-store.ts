import { getRedisClient } from '~/cache/client'
import { createOpaqueToken, hashToken } from '~/routes/auth/@shared/session/tokens'

const PASSWORD_RESET_TOKEN_TTL_SECONDS = 15 * 60
const passwordResetKeyPrefix = 'auth:password-reset:'

const resolvePasswordResetKey = (tokenHash: string): string => `${passwordResetKeyPrefix}${tokenHash}`

export const createPasswordResetToken = async (userId: string): Promise<string> => {
  const token = createOpaqueToken()
  const tokenHash = hashToken(token)
  const redis = await getRedisClient()

  await redis.setEx(resolvePasswordResetKey(tokenHash), PASSWORD_RESET_TOKEN_TTL_SECONDS, userId)
  return token
}

export const consumePasswordResetToken = async (token: string): Promise<string | null> => {
  const tokenHash = hashToken(token)
  const redis = await getRedisClient()
  const key = resolvePasswordResetKey(tokenHash)

  const userId = await redis.get(key)
  if (!userId) {
    return null
  }

  await redis.del(key)
  return userId
}
