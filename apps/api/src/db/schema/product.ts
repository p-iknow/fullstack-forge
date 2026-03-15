import { sql } from 'drizzle-orm'
import { boolean, check, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { categories } from './category'

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  sku: text('sku'),
  brand: text('brand'),
  weight: integer('weight'),
  price: integer('price').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  categoryId: uuid('category_id').references(() => categories.id),
  thumbUrl: text('thumb_url'),
  detailUrl: text('detail_url'),
  isSubstitutable: boolean('is_substitutable').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const inventory = pgTable(
  'inventory',
  {
    productId: uuid('product_id')
      .primaryKey()
      .references(() => products.id, { onDelete: 'cascade' }),
    onHand: integer('on_hand').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    safetyThreshold: integer('safety_threshold').notNull().default(0),
    version: integer('version').notNull().default(1),
  },
  (table) => [
    check('inventory_on_hand_non_negative_chk', sql`${table.onHand} >= 0`),
    check('inventory_reserved_non_negative_chk', sql`${table.reserved} >= 0`),
    check('inventory_reserved_lte_on_hand_chk', sql`${table.reserved} <= ${table.onHand}`),
  ],
)
