import type { Context } from 'hono'
import { getRedisClient } from '~/cache/client'

type RateLimitResult = {
  limited: boolean
  retryAfterSeconds: number
  remaining: number
}

const LOGIN_LIMIT = 5
const LOGIN_WINDOW_SECONDS = 15 * 60
const OAUTH_START_LIMIT = 20
const OAUTH_START_WINDOW_SECONDS = 15 * 60
const LOGOUT_LIMIT = 30
const LOGOUT_WINDOW_SECONDS = 15 * 60

export const enforceLoginRateLimit = async (
  c: Context,
  ipAddress: string,
): Promise<RateLimitResult> => {
  return enforceRateLimit(
    c,
    `ratelimit:auth:login:ip:${ipAddress}`,
    LOGIN_LIMIT,
    LOGIN_WINDOW_SECONDS,
  )
}

export const enforceOAuthStartRateLimit = async (
  c: Context,
  ipAddress: string,
): Promise<RateLimitResult> => {
  return enforceRateLimit(
    c,
    `ratelimit:auth:oauth-start:ip:${ipAddress}`,
    OAUTH_START_LIMIT,
    OAUTH_START_WINDOW_SECONDS,
  )
}

export const enforceLogoutRateLimit = async (
  c: Context,
  userKey: string,
): Promise<RateLimitResult> => {
  return enforceRateLimit(
    c,
    `ratelimit:auth:logout:user:${userKey}`,
    LOGOUT_LIMIT,
    LOGOUT_WINDOW_SECONDS,
  )
}

async function enforceRateLimit(
  c: Context,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const redis = await getRedisClient()
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, windowSeconds)
  }

  const ttlRaw = await redis.ttl(key)
  const ttl = ttlRaw > 0 ? ttlRaw : windowSeconds
  const remaining = Math.max(0, limit - count)
  const limited = count > limit

  c.header('RateLimit-Limit', String(limit))
  c.header('RateLimit-Remaining', String(remaining))
  c.header('RateLimit-Reset', String(ttl))
  if (limited) {
    c.header('Retry-After', String(ttl))
  }

  return {
    limited,
    retryAfterSeconds: ttl,
    remaining,
  }
}
