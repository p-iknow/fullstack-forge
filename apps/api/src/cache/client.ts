import { createClient } from 'redis'

export type RedisClient = ReturnType<typeof createClient>

let client: RedisClient | null = null
let connecting: Promise<RedisClient> | null = null

export async function getRedisClient(): Promise<RedisClient> {
  if (client?.isOpen) {
    return client
  }

  if (connecting) {
    return connecting
  }

  const nextClient: RedisClient = createClient({
    url: process.env.REDIS_URL?.trim() || 'redis://localhost:6379',
  })

  connecting = nextClient.connect().then(() => {
    client = nextClient
    connecting = null
    return nextClient
  })

  return connecting
}
