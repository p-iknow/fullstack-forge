import { z } from 'zod'

export const dlqMessageSchema = z.object({
  messageId: z.string(),
  eventId: z.uuid(),
  eventType: z.string(),
  traceId: z.uuid(),
  consumer: z.string(),
  failureCode: z.string().optional(),
  receiveCount: z.int(),
  sentTimestamp: z.string(),
  body: z.record(z.string(), z.unknown()),
})

export const dlqMessagesResponseSchema = z.object({
  messages: z.array(dlqMessageSchema),
  queueName: z.string(),
  approximateCount: z.int(),
})

export const redriveRequestSchema = z.object({
  queueName: z.string(),
})

export const redriveSingleRequestSchema = z.object({
  queueName: z.string(),
  messageId: z.string(),
})

export const redriveResponseSchema = z.object({
  redrivenCount: z.int(),
  queueName: z.string(),
})
