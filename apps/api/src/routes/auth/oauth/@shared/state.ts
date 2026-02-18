import { randomBytes } from 'node:crypto'
import { getRedisClient } from '~/cache/client'

const OAUTH_STATE_TTL_SECONDS = 5 * 60
const OAUTH_STATE_KEY_PREFIX = 'auth:oauth:state:'

export type OAuthStateProvider = 'google' | 'kakao'

export type OAuthStatePayload = {
  provider: OAuthStateProvider
  nonce: string
  redirectPath: string
}

export type OAuthStateRecord = OAuthStatePayload & {
  state: string
}

export const createOAuthState = async (payload: OAuthStatePayload): Promise<OAuthStateRecord> => {
  const state = randomBytes(24).toString('base64url')
  const record: OAuthStateRecord = {
    state,
    provider: payload.provider,
    nonce: payload.nonce,
    redirectPath: payload.redirectPath,
  }

  const redis = await getRedisClient()
  await redis.setEx(stateKey(state), OAUTH_STATE_TTL_SECONDS, JSON.stringify(record))

  return record
}

export const consumeOAuthState = async (state: string): Promise<OAuthStateRecord | null> => {
  const redis = await getRedisClient()
  const key = stateKey(state)
  const raw = await redis.get(key)
  if (!raw) {
    return null
  }

  await redis.del(key)

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!isOAuthStateRecord(parsed)) {
    return null
  }

  return parsed
}

const stateKey = (state: string): string => `${OAUTH_STATE_KEY_PREFIX}${state}`

const isOAuthStateRecord = (value: unknown): value is OAuthStateRecord => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    (candidate.provider === 'google' || candidate.provider === 'kakao') &&
    typeof candidate.state === 'string' &&
    typeof candidate.nonce === 'string' &&
    typeof candidate.redirectPath === 'string'
  )
}
