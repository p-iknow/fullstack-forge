import { describe, it } from 'vitest'

describe('event-consumer', () => {
  it.todo('fanout: SNS publish → 4 queues receive')
  it.todo('idempotency: same eventId processed only once')
  it.todo('DLQ: 3 consecutive failures → message moves to DLQ')
  it.todo('ack: successful processing deletes message')
})
