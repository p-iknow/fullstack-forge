import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs'
import {
  eventEnvelopeSchema,
  type EventEnvelope,
} from '@fullstack-forge/api-spec/event-schemas'
import { db } from '~/db/client'
import { eventConsumerLog } from '~/db/schema/index'
import { checkIdempotency, clearIdempotencyKey, markProcessed } from './idempotency-guard'
import { sqs } from './sqs-client'

export type MessageHandler = (envelope: EventEnvelope) => Promise<void>

async function logConsumerEvent(params: {
  eventId: string
  consumer: string
  status: 'processing' | 'success' | 'failed' | 'dlq'
  failureCode?: string
  receiveCount: number
}) {
  await db.insert(eventConsumerLog).values({
    eventId: params.eventId,
    consumer: params.consumer,
    status: params.status,
    failureCode: params.failureCode,
    receiveCount: params.receiveCount,
    processedAt: params.status === 'success' ? new Date() : undefined,
  })
}

export function createConsumer(params: {
  queueUrl: string
  consumerName: string
  handler: MessageHandler
}): { start: () => Promise<void>; stop: () => void } {
  let running = false

  async function poll() {
    return sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: params.queueUrl,
        WaitTimeSeconds: 20,
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 90,
        MessageSystemAttributeNames: ['ApproximateReceiveCount'],
      }),
    )
  }

  async function ack(receiptHandle: string) {
    await sqs.send(
      new DeleteMessageCommand({
        QueueUrl: params.queueUrl,
        ReceiptHandle: receiptHandle,
      }),
    )
  }

  async function start() {
    running = true

    while (running) {
      try {
        const result = await poll()
        const messages = result.Messages ?? []

        for (const message of messages) {
          if (!message.Body || !message.ReceiptHandle) {
            continue
          }

          const receiveCount = Number.parseInt(message.Attributes?.ApproximateReceiveCount ?? '1', 10)

          try {
            const envelope = eventEnvelopeSchema.parse(JSON.parse(message.Body))
            const { isDuplicate } = await checkIdempotency({
              consumer: params.consumerName,
              eventId: envelope.eventId,
            })

            if (isDuplicate) {
              await ack(message.ReceiptHandle)
              continue
            }

            await logConsumerEvent({
              eventId: envelope.eventId,
              consumer: params.consumerName,
              status: 'processing',
              receiveCount,
            })

            try {
              await params.handler(envelope)
              await markProcessed({
                consumer: params.consumerName,
                eventId: envelope.eventId,
              })
              await ack(message.ReceiptHandle)
              await logConsumerEvent({
                eventId: envelope.eventId,
                consumer: params.consumerName,
                status: 'success',
                receiveCount,
              })
            } catch (error) {
              await clearIdempotencyKey({
                consumer: params.consumerName,
                eventId: envelope.eventId,
              })
              await logConsumerEvent({
                eventId: envelope.eventId,
                consumer: params.consumerName,
                status: 'failed',
                failureCode: error instanceof Error ? error.name : 'unknown_error',
                receiveCount,
              })
              // oxlint-disable-next-line no-console
              console.error(`[${params.consumerName}] message handling failed`, error)
            }
          } catch (error) {
            // oxlint-disable-next-line no-console
            console.error(`[${params.consumerName}] message handling failed`, error)
          }
        }
      } catch (error) {
        // oxlint-disable-next-line no-console
        console.error(`[${params.consumerName}] polling failed`, error)
      }
    }
  }

  function stop() {
    running = false
  }

  return { start, stop }
}
