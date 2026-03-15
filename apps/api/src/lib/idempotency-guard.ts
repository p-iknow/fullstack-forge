import { getRedisClient } from '~/cache/client'

const IDEMPOTENCY_TTL = 604800

export async function checkIdempotency(params: {
  consumer: string
  eventId: string
}): Promise<{ isDuplicate: boolean }> {
  const redis = await getRedisClient()
  const key = `idempotency:${params.consumer}:${params.eventId}`
  const exists = await redis.get(key)
  return { isDuplicate: exists !== null }
}

export async function markProcessed(params: { consumer: string; eventId: string }): Promise<void> {
  const redis = await getRedisClient()
  const key = `idempotency:${params.consumer}:${params.eventId}`
  await redis.set(key, '1', { EX: IDEMPOTENCY_TTL, NX: true })
}

export async function clearIdempotencyKey(params: {
  consumer: string
  eventId: string
}): Promise<void> {
  const redis = await getRedisClient()
  const key = `idempotency:${params.consumer}:${params.eventId}`
  await redis.del(key)
}
