import type { RouteHandler } from '@hono/zod-openapi'
import {
  DeleteMessageCommand,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
} from '@aws-sdk/client-sqs'
import {
  getDlqMessagesRoute,
  redriveAllRoute,
  redriveSingleRoute,
} from '@fullstack-forge/api-spec/routes/events'
import { QUEUE_URLS, sqs } from '~/lib/sqs-client'
import type { QueueName } from '~/lib/sqs-client'

const NIL_UUID = '00000000-0000-0000-0000-000000000000'

const getDlqUrl = (queueName: string): string | null => {
  if (!(queueName in QUEUE_URLS)) return null
  const sourceUrl = QUEUE_URLS[queueName as QueueName]
  return sourceUrl.replace(`/${queueName}`, `/${queueName}-dlq`)
}

const parseBodyRecord = (body: string | undefined): Record<string, unknown> => {
  if (!body) {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(body)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    return parsed as Record<string, unknown>
  } catch {
    return {}
  }
}

const toSafeString = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') {
    return fallback
  }
  return value
}

const parseIntOrZero = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? '0', 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export const getDlqMessagesHandler: RouteHandler<typeof getDlqMessagesRoute> = async (c) => {
  const { queueName } = c.req.valid('query')
  if (!(queueName in QUEUE_URLS)) {
    return c.json({ code: 'event_invalid_queue', error: 'Invalid queue name' }, 400)
  }

  const dlqUrl = getDlqUrl(queueName)
  if (!dlqUrl) {
    return c.json({ code: 'event_queue_not_found', error: 'Queue not found' }, 404)
  }

  const [messagesResult, attributesResult] = await Promise.all([
    sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: dlqUrl,
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 0,
        MessageSystemAttributeNames: ['ApproximateReceiveCount', 'SentTimestamp'],
      }),
    ),
    sqs.send(
      new GetQueueAttributesCommand({
        QueueUrl: dlqUrl,
        AttributeNames: ['ApproximateNumberOfMessages'],
      }),
    ),
  ])

  const messages = (messagesResult.Messages ?? []).map((message) => {
    const body = parseBodyRecord(message.Body)

    return {
      messageId: message.MessageId ?? '',
      eventId: toSafeString(body.eventId, NIL_UUID),
      eventType: toSafeString(body.eventType, 'unknown'),
      traceId: toSafeString(body.traceId, NIL_UUID),
      consumer: toSafeString(body.source, 'unknown'),
      failureCode: typeof body.failureCode === 'string' ? body.failureCode : undefined,
      receiveCount: parseIntOrZero(message.Attributes?.ApproximateReceiveCount),
      sentTimestamp: message.Attributes?.SentTimestamp ?? '',
      body,
    }
  })

  return c.json(
    {
      messages,
      queueName,
      approximateCount: parseIntOrZero(attributesResult.Attributes?.ApproximateNumberOfMessages),
    },
    200,
  )
}

export const redriveAllHandler: RouteHandler<typeof redriveAllRoute> = async (c) => {
  const { queueName } = c.req.valid('json')
  if (!(queueName in QUEUE_URLS)) {
    return c.json({ code: 'event_invalid_queue', error: 'Invalid queue name' }, 400)
  }

  const sourceUrl = QUEUE_URLS[queueName as QueueName]
  const dlqUrl = getDlqUrl(queueName)
  if (!dlqUrl) {
    return c.json({ code: 'event_queue_not_found', error: 'Queue not found' }, 404)
  }

  let redrivenCount = 0

  while (true) {
    const receiveResult = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: dlqUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 1,
      }),
    )

    const batch = receiveResult.Messages ?? []
    if (batch.length === 0) {
      break
    }

    for (const message of batch) {
      if (!message.Body || !message.ReceiptHandle) {
        continue
      }

      await sqs.send(
        new SendMessageCommand({
          QueueUrl: sourceUrl,
          MessageBody: message.Body,
          MessageAttributes: message.MessageAttributes,
        }),
      )

      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: dlqUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      )

      redrivenCount += 1
    }
  }

  return c.json({ redrivenCount, queueName }, 200)
}

export const redriveSingleHandler: RouteHandler<typeof redriveSingleRoute> = async (c) => {
  const { messageId } = c.req.valid('param')
  const body = c.req.valid('json')
  const queueName = body.queueName

  if (body.messageId !== messageId) {
    return c.json({ code: 'event_message_id_mismatch', error: 'Message id mismatch' }, 400)
  }

  if (!(queueName in QUEUE_URLS)) {
    return c.json({ code: 'event_invalid_queue', error: 'Invalid queue name' }, 400)
  }

  const sourceUrl = QUEUE_URLS[queueName as QueueName]
  const dlqUrl = getDlqUrl(queueName)
  if (!dlqUrl) {
    return c.json({ code: 'event_queue_not_found', error: 'Queue not found' }, 404)
  }

  while (true) {
    const receiveResult = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: dlqUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 1,
      }),
    )

    const batch = receiveResult.Messages ?? []
    if (batch.length === 0) {
      return c.json({ code: 'event_message_not_found', error: 'Message not found' }, 404)
    }

    for (const message of batch) {
      if (message.MessageId !== messageId || !message.Body || !message.ReceiptHandle) {
        continue
      }

      await sqs.send(
        new SendMessageCommand({
          QueueUrl: sourceUrl,
          MessageBody: message.Body,
          MessageAttributes: message.MessageAttributes,
        }),
      )

      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: dlqUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      )

      return c.json({ redrivenCount: 1, queueName }, 200)
    }
  }
}
