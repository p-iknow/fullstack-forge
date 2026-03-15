import type { RouteHandler } from '@hono/zod-openapi'
import {
  createAdminProductRoute,
  deleteAdminProductRoute,
  updateAdminProductActiveRoute,
  updateAdminProductRoute,
  uploadAdminProductImagesRoute,
} from '@fullstack-forge/api-spec/routes/admin'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { eq } from 'drizzle-orm'
import sharp from 'sharp'
import { db } from '~/db/client'
import { categories, inventory, orderItems, products } from '~/db/schema/index'
import { getFallbackProductImageUrls } from '~/lib/product-image'
import { MINIO_BUCKET, publicUrl, s3 } from '~/lib/s3-client'
import {
  getAvailableStock,
  getProductSku,
  getStockDisplay,
} from '~/routes/catalog/@shared/view-model'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

const getInventorySnapshot = async (productId: string) => {
  const [inventoryRow] = await db
    .select({
      onHand: inventory.onHand,
      reserved: inventory.reserved,
      safetyThreshold: inventory.safetyThreshold,
    })
    .from(inventory)
    .where(eq(inventory.productId, productId))
    .limit(1)

  const available = getAvailableStock(inventoryRow?.onHand ?? 0, inventoryRow?.reserved ?? 0)
  const safetyThreshold = inventoryRow?.safetyThreshold ?? 5

  return {
    available,
    stockDisplay: getStockDisplay(available, safetyThreshold),
  }
}

const toAdminProduct = async (product: {
  id: string
  name: string
  description: string
  sku: string | null
  brand: string | null
  price: number
  weight: number | null
  isActive: boolean
  categoryId: string | null
  thumbUrl: string | null
  detailUrl: string | null
  isSubstitutable: boolean
  createdAt: Date
}) => {
  const inventorySnapshot = await getInventorySnapshot(product.id)

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: product.brand,
    price: product.price,
    weight: product.weight,
    isActive: product.isActive,
    stockDisplay: inventorySnapshot.stockDisplay,
    categoryId: product.categoryId,
    thumbUrl: product.thumbUrl,
    detailUrl: product.detailUrl,
    isSubstitutable: product.isSubstitutable,
    createdAt: product.createdAt.toISOString(),
  }
}

const selectProductColumns = {
  id: products.id,
  name: products.name,
  description: products.description,
  sku: products.sku,
  brand: products.brand,
  price: products.price,
  weight: products.weight,
  isActive: products.isActive,
  categoryId: products.categoryId,
  thumbUrl: products.thumbUrl,
  detailUrl: products.detailUrl,
  isSubstitutable: products.isSubstitutable,
  createdAt: products.createdAt,
}

const getFirstFileFromBody = (
  fileEntry: string | File | (string | File)[] | undefined,
): File | null => {
  if (!fileEntry) {
    return null
  }

  const candidate = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry
  if (typeof File === 'undefined') {
    return null
  }

  return candidate instanceof File ? candidate : null
}

export const createAdminProductHandler: RouteHandler<typeof createAdminProductRoute> = async (
  c,
) => {
  const body = c.req.valid('json')

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, body.categoryId))
    .limit(1)

  if (!category) {
    return c.json({ code: 'admin_category_not_found', error: 'Category not found' }, 400)
  }

  const fallbackImages = getFallbackProductImageUrls()
  const productId = crypto.randomUUID()

  const [created] = await db
    .insert(products)
    .values({
      id: productId,
      name: body.name,
      description: body.description,
      sku: getProductSku(productId),
      brand: body.brand,
      price: body.price,
      weight: body.weight,
      isActive: true,
      categoryId: body.categoryId,
      thumbUrl: fallbackImages.thumbUrl,
      detailUrl: fallbackImages.detailUrl,
      isSubstitutable: body.isSubstitutable,
    })
    .returning(selectProductColumns)

  await db.insert(inventory).values({
    productId: created.id,
    onHand: 0,
    reserved: 0,
    safetyThreshold: 0,
    version: 1,
  })

  return c.json(await toAdminProduct(created), 201)
}

export const updateAdminProductHandler: RouteHandler<typeof updateAdminProductRoute> = async (
  c,
) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const [found] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!found) {
    return c.json({ code: 'admin_product_not_found', error: 'Product not found' }, 404)
  }

  if (body.categoryId) {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, body.categoryId))
      .limit(1)

    if (!category) {
      return c.json({ code: 'admin_category_not_found', error: 'Category not found' }, 400)
    }
  }

  const [updated] = await db
    .update(products)
    .set(body)
    .where(eq(products.id, id))
    .returning(selectProductColumns)

  return c.json(await toAdminProduct(updated), 200)
}

export const updateAdminProductActiveHandler: RouteHandler<
  typeof updateAdminProductActiveRoute
> = async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const [found] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!found) {
    return c.json({ code: 'admin_product_not_found', error: 'Product not found' }, 404)
  }

  const [updated] = await db
    .update(products)
    .set({ isActive: body.isActive })
    .where(eq(products.id, id))
    .returning(selectProductColumns)

  return c.json(await toAdminProduct(updated), 200)
}

export const deleteAdminProductHandler: RouteHandler<typeof deleteAdminProductRoute> = async (
  c,
) => {
  const { id } = c.req.valid('param')

  const [found] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!found) {
    return c.json({ code: 'admin_product_not_found', error: 'Product not found' }, 404)
  }

  const [orderItem] = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.productId, id))
    .limit(1)

  if (orderItem) {
    return c.json({ code: 'admin_product_has_orders', error: 'Product has order history' }, 409)
  }

  await db.delete(products).where(eq(products.id, id))

  return c.body(null, 204)
}

export const uploadAdminProductImagesHandler: RouteHandler<
  typeof uploadAdminProductImagesRoute
> = async (c) => {
  const { id } = c.req.valid('param')

  const [found] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!found) {
    return c.json({ code: 'admin_product_not_found', error: 'Product not found' }, 404)
  }

  const body = await c.req.parseBody()
  const thumbFile = getFirstFileFromBody(body.thumb)
  const detailFile = getFirstFileFromBody(body.detail)

  if (!thumbFile || !detailFile) {
    return c.json(
      {
        code: 'admin_product_image_invalid_file',
        error: 'Both thumb and detail images are required',
      },
      400,
    )
  }

  for (const file of [thumbFile, detailFile]) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return c.json(
        { code: 'admin_product_image_invalid_type', error: 'Unsupported image type' },
        400,
      )
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return c.json(
        { code: 'admin_product_image_too_large', error: 'Image exceeds 5MB limit' },
        400,
      )
    }
  }

  const thumbSource = Buffer.from(await thumbFile.arrayBuffer())
  const detailSource = Buffer.from(await detailFile.arrayBuffer())

  const thumbBuffer = await sharp(thumbSource)
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer()
  const detailBuffer = await sharp(detailSource)
    .resize(800, 600, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer()

  const thumbKey = `sku-${id}-thumb.webp`
  const detailKey = `sku-${id}-detail.webp`

  await s3.send(
    new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: thumbKey,
      Body: thumbBuffer,
      ContentType: 'image/webp',
    }),
  )
  await s3.send(
    new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: detailKey,
      Body: detailBuffer,
      ContentType: 'image/webp',
    }),
  )

  const thumbUrl = publicUrl(thumbKey)
  const detailUrl = publicUrl(detailKey)

  await db
    .update(products)
    .set({
      thumbUrl,
      detailUrl,
    })
    .where(eq(products.id, id))
    .returning({ id: products.id })

  return c.json({ thumbUrl, detailUrl }, 200)
}
