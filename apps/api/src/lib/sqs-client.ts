import { SQSClient } from '@aws-sdk/client-sqs'

const ENDPOINT = process.env.AWS_ENDPOINT_URL ?? 'http://127.0.0.1:4566'
const REGION = process.env.AWS_REGION ?? 'us-east-1'

export const sqs = new SQSClient({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
  },
})

export const QUEUE_URLS = {
  notifications:
    process.env.SQS_NOTIFICATIONS_URL ??
    `http://sqs.${REGION}.localhost:4566/000000000000/notifications`,
  inventory:
    process.env.SQS_INVENTORY_URL ?? `http://sqs.${REGION}.localhost:4566/000000000000/inventory`,
  dispatch:
    process.env.SQS_DISPATCH_URL ?? `http://sqs.${REGION}.localhost:4566/000000000000/dispatch`,
  order: process.env.SQS_ORDER_URL ?? `http://sqs.${REGION}.localhost:4566/000000000000/order`,
} as const

export type QueueName = keyof typeof QUEUE_URLS
