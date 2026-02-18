import { getRedisClient } from '~/cache/client'

const LOGIN_FAILURE_THRESHOLD = 5
const LOGIN_FAILURE_WINDOW_SECONDS = 15 * 60
const ACCOUNT_LOCK_WINDOW_SECONDS = 15 * 60

type LoginFailureResult = {
  locked: boolean
  retryAfterSeconds: number
}

export const registerLoginFailure = async (userId: string): Promise<LoginFailureResult> => {
  const redis = await getRedisClient()
  const failureKey = failureCountKey(userId)
  const lockKey = lockStateKey(userId)

  const failureCount = await redis.incr(failureKey)
  if (failureCount === 1) {
    await redis.expire(failureKey, LOGIN_FAILURE_WINDOW_SECONDS)
  }

  if (failureCount >= LOGIN_FAILURE_THRESHOLD) {
    await redis.setEx(lockKey, ACCOUNT_LOCK_WINDOW_SECONDS, '1')
    const ttl = await resolveTtl(redis, lockKey, ACCOUNT_LOCK_WINDOW_SECONDS)
    return {
      locked: true,
      retryAfterSeconds: ttl,
    }
  }

  const ttl = await resolveTtl(redis, failureKey, LOGIN_FAILURE_WINDOW_SECONDS)
  return {
    locked: false,
    retryAfterSeconds: ttl,
  }
}

export const clearLoginFailureState = async (userId: string): Promise<void> => {
  const redis = await getRedisClient()
  await redis.del(failureCountKey(userId))
  await redis.del(lockStateKey(userId))
}

export const getLockStateTtl = async (userId: string): Promise<number | null> => {
  const redis = await getRedisClient()
  const exists = await redis.exists(lockStateKey(userId))
  if (!exists) {
    return null
  }

  return resolveTtl(redis, lockStateKey(userId), ACCOUNT_LOCK_WINDOW_SECONDS)
}

const failureCountKey = (userId: string): string => `auth:login-failures:${userId}`

const lockStateKey = (userId: string): string => `auth:locked:${userId}`

const resolveTtl = async (
  redis: Awaited<ReturnType<typeof getRedisClient>>,
  key: string,
  fallback: number,
): Promise<number> => {
  const ttl = await redis.ttl(key)
  return ttl > 0 ? ttl : fallback
}
