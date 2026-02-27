import { S3Client } from '@aws-sdk/client-s3'

export const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? 'http://127.0.0.1:9002'
export const MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'product-images'
export const MINIO_REGION = process.env.MINIO_REGION ?? 'us-east-1'

export const s3 = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: MINIO_REGION,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  },
  forcePathStyle: true,
})

export const publicUrl = (key: string): string => `${MINIO_ENDPOINT}/${MINIO_BUCKET}/${key}`
