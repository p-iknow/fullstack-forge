import { PublishCommand } from '@aws-sdk/client-sns'
import type { EventType } from '@fullstack-forge/api-spec/event-schemas'
import { EVENT_TOPIC_ARN, sns } from './sns-client'

export async function publishEvent(params: {
  eventType: EventType
  payload: Record<string, unknown>
  traceId?: string
  source?: string
}): Promise<{ eventId: string; messageId: string }> {
  const eventId = crypto.randomUUID()
  const traceId = params.traceId ?? crypto.randomUUID()

  const envelope = {
    eventId,
    eventType: params.eventType,
    schemaVersion: 'v1',
    occurredAt: new Date().toISOString(),
    traceId,
    source: params.source ?? 'api',
    payload: params.payload,
  }

  const result = await sns.send(
    new PublishCommand({
      TopicArn: EVENT_TOPIC_ARN,
      Message: JSON.stringify(envelope),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: params.eventType,
        },
      },
    }),
  )

  return { eventId, messageId: result.MessageId! }
}
