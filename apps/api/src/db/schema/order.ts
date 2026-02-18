import { integer, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { products } from './product'

export const orderStatusEnum = pgEnum('order_status', [
  'created',
  'paid',
  'picking',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'failed',
])

export const paymentStatusEnum = pgEnum('payment_status', [
  'initiated',
  'authorized',
  'captured',
  'failed',
  'cancelled',
])

export const paymentMethodEnum = pgEnum('payment_method', ['card', 'wallet', 'bank_transfer'])

export const deliveryStatusEnum = pgEnum('delivery_status', [
  'scheduled',
  'out_for_delivery',
  'delivered',
  'failed',
  'cancelled',
])

export const deliveryModeEnum = pgEnum('delivery_mode', ['instant', 'scheduled'])

export const substitutionStatusEnum = pgEnum('substitution_status', [
  'proposed',
  'approved',
  'rejected',
  'applied',
  'cancelled',
])

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  status: orderStatusEnum('status').notNull().default('created'),
  totalAmount: integer('total_amount').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  substitutionId: uuid('substitution_id'),
})

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  method: paymentMethodEnum('method').notNull(),
  status: paymentStatusEnum('status').notNull().default('initiated'),
  amount: integer('amount').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
})

export const deliveries = pgTable('deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  status: deliveryStatusEnum('status').notNull().default('scheduled'),
  mode: deliveryModeEnum('mode').notNull().default('instant'),
  estimatedAt: timestamp('estimated_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
})

export const substitutions = pgTable('substitutions', {
  id: uuid('id').defaultRandom().primaryKey(),
  originalProductId: uuid('original_product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  substituteProductId: uuid('substitute_product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  status: substitutionStatusEnum('status').notNull().default('proposed'),
})
