import { integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { orders } from './order'

export const promotionTypeEnum = pgEnum('promotion_type', ['coupon', 'category_discount'])
export const discountTypeEnum = pgEnum('discount_type', ['fixed_amount', 'percentage'])
export const promotionStatusEnum = pgEnum('promotion_status', ['active', 'inactive', 'expired'])

export const promotions = pgTable('promotions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: promotionTypeEnum('type').notNull(),
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: integer('discount_value').notNull(),
  minOrderAmount: integer('min_order_amount').notNull().default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  status: promotionStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const promotionCategories = pgTable(
  'promotion_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    promotionId: uuid('promotion_id')
      .notNull()
      .references(() => promotions.id, { onDelete: 'cascade' }),
    categoryId: text('category_id').notNull(),
  },
  (table) => [
    uniqueIndex('promotion_categories_promotion_id_category_id_idx').on(
      table.promotionId,
      table.categoryId,
    ),
  ],
)

export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  promotionId: uuid('promotion_id')
    .notNull()
    .references(() => promotions.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(),
  maxUses: integer('max_uses').notNull().default(0),
  perUserLimit: integer('per_user_limit').notNull().default(1),
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const couponRedemptions = pgTable(
  'coupon_redemptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'restrict' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    discountAmount: integer('discount_amount').notNull(),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('coupon_redemptions_coupon_id_user_id_order_id_idx').on(
      table.couponId,
      table.userId,
      table.orderId,
    ),
  ],
)

export const orderPromotions = pgTable(
  'order_promotions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    promotionId: uuid('promotion_id')
      .notNull()
      .references(() => promotions.id, { onDelete: 'restrict' }),
    couponRedemptionId: uuid('coupon_redemption_id').references(() => couponRedemptions.id, {
      onDelete: 'set null',
    }),
    discountAmount: integer('discount_amount').notNull(),
    selectedByRule: text('selected_by_rule').notNull().default('best_price_policy'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('order_promotions_order_id_promotion_id_idx').on(table.orderId, table.promotionId),
  ],
)
