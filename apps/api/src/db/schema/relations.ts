import { relations } from 'drizzle-orm'
import { auditLogs, userCredentials, userOauthAccounts, userSessions, users } from './auth'
import { cartItems, carts } from './cart'
import { eventConsumerLog, eventOutbox } from './event'
import { customerInquiries, inquiryReplies } from './inquiry'
import { deliveries, orderItems, orders, payments, substitutions } from './order'
import { loyaltyAccounts, pointLedgers, pointPolicies, pointRedemptions } from './points'
import { categories } from './category'
import { inventory, products } from './product'
import {
  couponRedemptions,
  coupons,
  orderPromotions,
  promotionCategories,
  promotions,
} from './promotion'
import { reviewComments, reviews } from './review'

export const usersRelations = relations(users, ({ one, many }) => ({
  credentials: one(userCredentials, {
    fields: [users.id],
    references: [userCredentials.userId],
  }),
  oauthAccounts: many(userOauthAccounts),
  sessions: many(userSessions),
  auditLogs: many(auditLogs),
  orders: many(orders),
  loyaltyAccount: one(loyaltyAccounts, {
    fields: [users.id],
    references: [loyaltyAccounts.userId],
  }),
  pointLedgers: many(pointLedgers),
  pointRedemptions: many(pointRedemptions),
  reviews: many(reviews),
  reviewComments: many(reviewComments),
  inquiries: many(customerInquiries),
  inquiryReplies: many(inquiryReplies),
  couponRedemptions: many(couponRedemptions),
  carts: many(carts),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  inventory: one(inventory, {
    fields: [products.id],
    references: [inventory.productId],
  }),
  orderItems: many(orderItems),
  substitutionsAsOriginal: many(substitutions, { relationName: 'original_product_substitutions' }),
  substitutionsAsSubstitute: many(substitutions, {
    relationName: 'substitute_product_substitutions',
  }),
  cartItems: many(cartItems),
}))

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}))

export const eventOutboxRelations = relations(eventOutbox, () => ({}))

export const eventConsumerLogRelations = relations(eventConsumerLog, () => ({}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
  deliveries: many(deliveries),
  substitutions: many(substitutions),
  promotions: many(orderPromotions),
  pointLedgers: many(pointLedgers),
  pointRedemption: one(pointRedemptions, {
    fields: [orders.id],
    references: [pointRedemptions.orderId],
  }),
}))

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  reviews: many(reviews),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}))

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  order: one(orders, {
    fields: [deliveries.orderId],
    references: [orders.id],
  }),
}))

export const substitutionsRelations = relations(substitutions, ({ one }) => ({
  order: one(orders, {
    fields: [substitutions.orderId],
    references: [orders.id],
  }),
  originalProduct: one(products, {
    fields: [substitutions.originalProductId],
    references: [products.id],
    relationName: 'original_product_substitutions',
  }),
  substituteProduct: one(products, {
    fields: [substitutions.substituteProductId],
    references: [products.id],
    relationName: 'substitute_product_substitutions',
  }),
}))

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  orderItem: one(orderItems, {
    fields: [reviews.orderItemId],
    references: [orderItems.id],
  }),
  comments: many(reviewComments),
}))

export const reviewCommentsRelations = relations(reviewComments, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewComments.reviewId],
    references: [reviews.id],
  }),
  user: one(users, {
    fields: [reviewComments.userId],
    references: [users.id],
  }),
}))

export const customerInquiriesRelations = relations(customerInquiries, ({ one, many }) => ({
  user: one(users, {
    fields: [customerInquiries.userId],
    references: [users.id],
  }),
  replies: many(inquiryReplies),
}))

export const inquiryRepliesRelations = relations(inquiryReplies, ({ one }) => ({
  inquiry: one(customerInquiries, {
    fields: [inquiryReplies.inquiryId],
    references: [customerInquiries.id],
  }),
  user: one(users, {
    fields: [inquiryReplies.userId],
    references: [users.id],
  }),
}))

export const loyaltyAccountsRelations = relations(loyaltyAccounts, ({ one }) => ({
  user: one(users, {
    fields: [loyaltyAccounts.userId],
    references: [users.id],
  }),
}))

export const pointPoliciesRelations = relations(pointPolicies, ({ many }) => ({
  ledgers: many(pointLedgers),
}))

export const pointLedgersRelations = relations(pointLedgers, ({ one }) => ({
  user: one(users, {
    fields: [pointLedgers.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [pointLedgers.orderId],
    references: [orders.id],
  }),
  policy: one(pointPolicies, {
    fields: [pointLedgers.policyId],
    references: [pointPolicies.id],
  }),
}))

export const pointRedemptionsRelations = relations(pointRedemptions, ({ one }) => ({
  user: one(users, {
    fields: [pointRedemptions.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [pointRedemptions.orderId],
    references: [orders.id],
  }),
}))

export const promotionsRelations = relations(promotions, ({ many }) => ({
  categories: many(promotionCategories),
  coupons: many(coupons),
  orderPromotions: many(orderPromotions),
}))

export const promotionCategoriesRelations = relations(promotionCategories, ({ one }) => ({
  promotion: one(promotions, {
    fields: [promotionCategories.promotionId],
    references: [promotions.id],
  }),
}))

export const couponsRelations = relations(coupons, ({ one, many }) => ({
  promotion: one(promotions, {
    fields: [coupons.promotionId],
    references: [promotions.id],
  }),
  redemptions: many(couponRedemptions),
}))

export const couponRedemptionsRelations = relations(couponRedemptions, ({ one, many }) => ({
  coupon: one(coupons, {
    fields: [couponRedemptions.couponId],
    references: [coupons.id],
  }),
  user: one(users, {
    fields: [couponRedemptions.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [couponRedemptions.orderId],
    references: [orders.id],
  }),
  orderPromotions: many(orderPromotions),
}))

export const orderPromotionsRelations = relations(orderPromotions, ({ one }) => ({
  order: one(orders, {
    fields: [orderPromotions.orderId],
    references: [orders.id],
  }),
  promotion: one(promotions, {
    fields: [orderPromotions.promotionId],
    references: [promotions.id],
  }),
  couponRedemption: one(couponRedemptions, {
    fields: [orderPromotions.couponRedemptionId],
    references: [couponRedemptions.id],
  }),
}))
