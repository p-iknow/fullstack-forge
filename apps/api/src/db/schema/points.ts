import { sql } from 'drizzle-orm'
import {
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { orders } from './order'

const pointAccrualTypeEnum = pgEnum('point_accrual_type', ['percentage', 'fixed_per_order'])
const pointPolicyStatusEnum = pgEnum('point_policy_status', ['active', 'inactive'])
const pointTransactionTypeEnum = pgEnum('point_transaction_type', [
  'earn',
  'redeem',
  'expire',
  'adjust',
  'rollback',
])
const pointSourceTypeEnum = pgEnum('point_source_type', [
  'order_payment',
  'order_cancel',
  'review_reward',
  'event_reward',
  'admin_adjust',
])
const pointLedgerStatusEnum = pgEnum('point_ledger_status', ['pending', 'confirmed', 'cancelled'])

const pointPolicies = pgTable('point_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  accrualType: pointAccrualTypeEnum('accrual_type').notNull(),
  accrualValue: integer('accrual_value').notNull(),
  minOrderAmount: integer('min_order_amount').notNull().default(0),
  maxEarnPerOrder: integer('max_earn_per_order').notNull().default(0),
  minRedeemPoints: integer('min_redeem_points').notNull().default(0),
  pointToCurrencyRate: integer('point_to_currency_rate').notNull().default(1),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  status: pointPolicyStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

const loyaltyAccounts = pgTable(
  'loyalty_accounts',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    availablePoints: integer('available_points').notNull().default(0),
    pendingPoints: integer('pending_points').notNull().default(0),
    lifetimeEarned: integer('lifetime_earned').notNull().default(0),
    lifetimeRedeemed: integer('lifetime_redeemed').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check('loyalty_accounts_available_points_non_negative_chk', sql`${table.availablePoints} >= 0`),
    check('loyalty_accounts_pending_points_non_negative_chk', sql`${table.pendingPoints} >= 0`),
    check('loyalty_accounts_lifetime_earned_non_negative_chk', sql`${table.lifetimeEarned} >= 0`),
    check(
      'loyalty_accounts_lifetime_redeemed_non_negative_chk',
      sql`${table.lifetimeRedeemed} >= 0`,
    ),
  ],
)

const pointLedgers = pgTable(
  'point_ledgers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    policyId: uuid('policy_id').references(() => pointPolicies.id, { onDelete: 'set null' }),
    transactionType: pointTransactionTypeEnum('transaction_type').notNull(),
    sourceType: pointSourceTypeEnum('source_type').notNull(),
    points: integer('points').notNull(),
    status: pointLedgerStatusEnum('status').notNull().default('confirmed'),
    description: text('description'),
    availableAt: timestamp('available_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [check('point_ledgers_points_positive_chk', sql`${table.points} > 0`)],
)

const pointRedemptions = pgTable(
  'point_redemptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    pointsUsed: integer('points_used').notNull(),
    discountAmount: integer('discount_amount').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('point_redemptions_order_id_idx').on(table.orderId),
    check('point_redemptions_points_used_positive_chk', sql`${table.pointsUsed} > 0`),
    check('point_redemptions_discount_amount_non_negative_chk', sql`${table.discountAmount} >= 0`),
  ],
)

export {
  loyaltyAccounts,
  pointAccrualTypeEnum,
  pointLedgerStatusEnum,
  pointLedgers,
  pointPolicies,
  pointPolicyStatusEnum,
  pointRedemptions,
  pointSourceTypeEnum,
  pointTransactionTypeEnum,
}
