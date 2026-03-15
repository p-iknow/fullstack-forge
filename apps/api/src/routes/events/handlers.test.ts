import { describe, it } from 'vitest'

describe('event admin DLQ handlers', () => {
  it.todo('GET /admin/events/dlq/messages returns DLQ messages')
  it.todo('POST /admin/events/dlq/redrive redrives all DLQ messages')
  it.todo('POST /admin/events/dlq/redrive/:messageId redrives single message')
  it.todo('returns 401 for unauthenticated requests')
})
