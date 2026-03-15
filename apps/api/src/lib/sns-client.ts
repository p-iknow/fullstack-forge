import { SNSClient } from '@aws-sdk/client-sns'

const ENDPOINT = process.env.AWS_ENDPOINT_URL ?? 'http://127.0.0.1:4566'
const REGION = process.env.AWS_REGION ?? 'us-east-1'

export const sns = new SNSClient({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
  },
})

export const EVENT_TOPIC_ARN =
  process.env.EVENT_TOPIC_ARN ?? `arn:aws:sns:${REGION}:000000000000:fullstack-forge-events`
