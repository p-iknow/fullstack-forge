import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './auth'

const inquiryCategoryEnum = pgEnum('inquiry_category', [
  'order',
  'payment',
  'delivery',
  'product',
  'account',
  'other',
])

const inquiryStatusEnum = pgEnum('inquiry_status', ['open', 'in_progress', 'resolved', 'closed'])

const customerInquiries = pgTable('customer_inquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  category: inquiryCategoryEnum('category').notNull(),
  subject: text('subject').notNull(),
  content: text('content').notNull(),
  status: inquiryStatusEnum('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

const inquiryReplies = pgTable('inquiry_replies', {
  id: uuid('id').defaultRandom().primaryKey(),
  inquiryId: uuid('inquiry_id')
    .notNull()
    .references(() => customerInquiries.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export { customerInquiries, inquiryCategoryEnum, inquiryReplies, inquiryStatusEnum }
