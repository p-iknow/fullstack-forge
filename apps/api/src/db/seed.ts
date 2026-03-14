import { db } from '~/db/client'
import { publicUrl } from '~/lib/s3-client'
import {
  auditLogs,
  categories,
  couponRedemptions,
  coupons,
  customerInquiries,
  deliveries,
  inquiryReplies,
  inventory,
  loyaltyAccounts,
  orderPromotions,
  orderItems,
  orders,
  payments,
  pointLedgers,
  pointPolicies,
  pointRedemptions,
  promotionCategories,
  promotions,
  products,
  reviewComments,
  reviews,
  substitutions,
  userCredentials,
  userOauthAccounts,
  userSessions,
  users,
} from '~/db/schema/index'
import { PRODUCT_CATALOG } from '~/db/seed-product-catalog'
import { buildSeedUserCredentialRows } from '~/db/seed-users'

async function seed(): Promise<void> {
  await db.delete(orderPromotions)
  await db.delete(couponRedemptions)
  await db.delete(coupons)
  await db.delete(promotionCategories)
  await db.delete(promotions)

  await db.delete(pointRedemptions)
  await db.delete(pointLedgers)
  await db.delete(pointPolicies)
  await db.delete(loyaltyAccounts)

  await db.delete(inquiryReplies)
  await db.delete(customerInquiries)
  await db.delete(reviewComments)
  await db.delete(reviews)
  await db.delete(substitutions)
  await db.delete(deliveries)
  await db.delete(payments)
  await db.delete(orderItems)
  await db.delete(orders)
  await db.delete(inventory)
  await db.delete(products)
  await db.delete(categories)
  await db.delete(auditLogs)
  await db.delete(userOauthAccounts)
  await db.delete(userSessions)
  await db.delete(userCredentials)
  await db.delete(users)

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        email: 'customer@fullstack-forge.local',
        name: 'Seed Customer',
        role: 'customer',
        status: 'active',
      },
      {
        email: 'operator@fullstack-forge.local',
        name: 'Seed Operator',
        role: 'operator',
        status: 'active',
      },
      {
        email: 'admin@fullstack-forge.local',
        name: 'Seed Admin',
        role: 'admin',
        status: 'active',
      },
    ])
    .returning({ id: users.id, email: users.email })

  const credentialRows = await buildSeedUserCredentialRows(insertedUsers)

  await db.insert(userCredentials).values(credentialRows)

  const insertedCategories = await db
    .insert(categories)
    .values([
      {
        name: '상온 간편식',
        slug: 'convenience-food',
        displayOrder: 1,
        isActive: true,
      },
      {
        name: '음료',
        slug: 'beverage',
        displayOrder: 2,
        isActive: true,
      },
      {
        name: '위생용품',
        slug: 'hygiene',
        displayOrder: 3,
        isActive: true,
      },
      {
        name: '세탁/청소',
        slug: 'laundry-cleaning',
        displayOrder: 4,
        isActive: true,
      },
      {
        name: '반려소모품',
        slug: 'pet-supplies',
        displayOrder: 5,
        isActive: true,
      },
      {
        name: '셀프케어',
        slug: 'self-care',
        displayOrder: 6,
        isActive: true,
      },
    ])
    .returning({ id: categories.id, slug: categories.slug })

  const legacyCategoryIdToUuid = new Map<string, string>(
    insertedCategories.map((category, index) => [`cat-${index + 1}`, category.id]),
  )

  const seededProducts = PRODUCT_CATALOG.map((product) => ({
    categoryId: legacyCategoryIdToUuid.get(product.categoryId),
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    description: product.description,
    price: product.price,
    weight: product.weight,
    isActive: product.isActive,
    thumbUrl: publicUrl(product.thumbKey),
    detailUrl: publicUrl(product.detailKey),
    isSubstitutable: product.isSubstitutable,
  }))

  const insertedProducts = await db
    .insert(products)
    .values(seededProducts)
    .returning({ id: products.id })

  await db.insert(inventory).values(
    insertedProducts.map((product, index) => {
      const seededProduct = PRODUCT_CATALOG[index]
      if (!seededProduct) {
        throw new Error('seed product catalog index mismatch')
      }

      if (!seededProduct.isActive || index % 9 === 0) {
        return {
          productId: product.id,
          onHand: 0,
          reserved: 0,
          safetyThreshold: 5,
          version: 1,
        }
      }

      if (index % 6 === 0) {
        return {
          productId: product.id,
          onHand: 3,
          reserved: 0,
          safetyThreshold: 5,
          version: 1,
        }
      }

      const onHand = 20 + (index % 12)
      const reserved = index % 5
      return {
        productId: product.id,
        onHand,
        reserved,
        safetyThreshold: 5,
        version: 1,
      }
    }),
  )

  const customerUser = insertedUsers.find((user) => user.email === 'customer@fullstack-forge.local')
  if (!customerUser) {
    throw new Error('seed customer account not found')
  }

  const seedOrder = await db
    .insert(orders)
    .values({
      userId: customerUser.id,
      status: 'paid',
      totalAmount: 17800,
    })
    .returning({ id: orders.id })

  const firstOrder = seedOrder[0]
  const firstProduct = insertedProducts[0]
  const secondProduct = insertedProducts[1]

  await db.insert(orderItems).values([
    {
      orderId: firstOrder.id,
      productId: firstProduct.id,
      quantity: 2,
      unitPrice: 3500,
    },
    {
      orderId: firstOrder.id,
      productId: secondProduct.id,
      quantity: 1,
      unitPrice: 2200,
    },
  ])

  await db.insert(payments).values({
    orderId: firstOrder.id,
    method: 'card',
    status: 'captured',
    amount: 17800,
    paidAt: new Date(),
  })

  const now = new Date()
  const oneYearLater = new Date(now)
  oneYearLater.setFullYear(now.getFullYear() + 1)

  const [seedCouponPromotion] = await db
    .insert(promotions)
    .values({
      name: 'Welcome 5% coupon',
      type: 'coupon',
      discountType: 'percentage',
      discountValue: 5,
      minOrderAmount: 15000,
      startsAt: now,
      endsAt: oneYearLater,
      status: 'active',
    })
    .returning({ id: promotions.id })

  const [seedCategoryPromotion] = await db
    .insert(promotions)
    .values({
      name: 'Fruit category fixed discount',
      type: 'category_discount',
      discountType: 'fixed_amount',
      discountValue: 1200,
      minOrderAmount: 10000,
      startsAt: now,
      endsAt: oneYearLater,
      status: 'active',
    })
    .returning({ id: promotions.id })

  const convenienceFoodCategoryId = legacyCategoryIdToUuid.get('cat-1')
  if (!convenienceFoodCategoryId) {
    throw new Error('seed category mapping for cat-1 not found')
  }

  await db.insert(promotionCategories).values({
    promotionId: seedCategoryPromotion.id,
    categoryId: convenienceFoodCategoryId,
  })

  const [welcomeCoupon] = await db
    .insert(coupons)
    .values({
      promotionId: seedCouponPromotion.id,
      code: 'WELCOME-5PCT',
      maxUses: 1000,
      perUserLimit: 1,
      usedCount: 1,
      expiresAt: oneYearLater,
    })
    .returning({ id: coupons.id })

  const [couponUse] = await db
    .insert(couponRedemptions)
    .values({
      couponId: welcomeCoupon.id,
      userId: customerUser.id,
      orderId: firstOrder.id,
      discountAmount: 890,
    })
    .returning({ id: couponRedemptions.id })

  await db.insert(orderPromotions).values({
    orderId: firstOrder.id,
    promotionId: seedCouponPromotion.id,
    couponRedemptionId: couponUse.id,
    discountAmount: 890,
    selectedByRule: 'best_price_policy',
  })

  const [activePointPolicy] = await db
    .insert(pointPolicies)
    .values({
      name: 'Default paid order point policy',
      accrualType: 'percentage',
      accrualValue: 2,
      minOrderAmount: 10000,
      maxEarnPerOrder: 1000,
      minRedeemPoints: 100,
      pointToCurrencyRate: 1,
      startsAt: now,
      endsAt: oneYearLater,
      status: 'active',
    })
    .returning({ id: pointPolicies.id })

  await db.insert(loyaltyAccounts).values(
    insertedUsers.map((user) => {
      if (user.email === 'customer@fullstack-forge.local') {
        return {
          userId: user.id,
          availablePoints: 100,
          pendingPoints: 50,
          lifetimeEarned: 300,
          lifetimeRedeemed: 200,
        }
      }
      return {
        userId: user.id,
        availablePoints: 0,
        pendingPoints: 0,
        lifetimeEarned: 0,
        lifetimeRedeemed: 0,
      }
    }),
  )

  await db.insert(pointLedgers).values([
    {
      userId: customerUser.id,
      orderId: firstOrder.id,
      policyId: activePointPolicy.id,
      transactionType: 'earn',
      sourceType: 'order_payment',
      points: 300,
      status: 'confirmed',
      description: '2% cashback for paid order',
      availableAt: now,
      expiresAt: oneYearLater,
    },
    {
      userId: customerUser.id,
      orderId: firstOrder.id,
      policyId: activePointPolicy.id,
      transactionType: 'redeem',
      sourceType: 'order_payment',
      points: 200,
      status: 'confirmed',
      description: 'point redemption at checkout',
      availableAt: now,
      expiresAt: oneYearLater,
    },
    {
      userId: customerUser.id,
      transactionType: 'earn',
      sourceType: 'review_reward',
      points: 50,
      status: 'pending',
      description: 'review reward pending moderation',
      availableAt: oneYearLater,
      expiresAt: oneYearLater,
    },
  ])

  await db.insert(pointRedemptions).values({
    userId: customerUser.id,
    orderId: firstOrder.id,
    pointsUsed: 200,
    discountAmount: 200,
  })

  // eslint-disable-next-line no-console
  console.log(
    `Seeded users=${insertedUsers.length}, products=${insertedProducts.length}, orders=1, promotions=2, point_ledgers=3`,
  )
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed', error)
    process.exit(1)
  })
