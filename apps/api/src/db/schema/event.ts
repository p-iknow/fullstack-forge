import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const eventStatusEnum = pgEnum('event_status', ['pending', 'published', 'failed'])
export const consumerStatusEnum = pgEnum('consumer_status', [
  'processing',
  'success',
  'failed',
  'dlq',
])

export const eventOutbox = pgTable('event_outbox', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  schemaVersion: text('schema_version').notNull().default('v1'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  traceId: uuid('trace_id').notNull(),
  source: text('source').notNull().default('api'),
  payload: jsonb('payload').notNull(),
  status: eventStatusEnum('status').notNull().default('pending'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const eventConsumerLog = pgTable('event_consumer_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull(),
  consumer: text('consumer').notNull(),
  status: consumerStatusEnum('status').notNull(),
  failureCode: text('failure_code'),
  receiveCount: integer('receive_count').notNull().default(0),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
