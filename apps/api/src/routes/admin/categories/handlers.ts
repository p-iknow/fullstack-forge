import type { RouteHandler } from '@hono/zod-openapi'
import {
  createAdminCategoryRoute,
  deleteAdminCategoryRoute,
  getAdminCategoriesRoute,
  updateAdminCategoryRoute,
} from '@fullstack-forge/api-spec/routes/admin'
import { asc, eq } from 'drizzle-orm'
import { db } from '~/db/client'
import { categories, products } from '~/db/schema/index'

const toAdminCategory = (category: {
  id: string
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
  createdAt: Date
}) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  displayOrder: category.displayOrder,
  isActive: category.isActive,
  createdAt: category.createdAt.toISOString(),
})

export const getAdminCategoriesHandler: RouteHandler<typeof getAdminCategoriesRoute> = async (
  c,
) => {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      displayOrder: categories.displayOrder,
      isActive: categories.isActive,
      createdAt: categories.createdAt,
    })
    .from(categories)
    .orderBy(asc(categories.displayOrder))

  return c.json({ items: rows.map(toAdminCategory) }, 200)
}

export const createAdminCategoryHandler: RouteHandler<typeof createAdminCategoryRoute> = async (
  c,
) => {
  const body = c.req.valid('json')

  const [existingSlug] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, body.slug))
    .limit(1)

  if (existingSlug) {
    return c.json(
      { code: 'admin_category_slug_conflict', error: 'Category slug already exists' },
      409,
    )
  }

  const [created] = await db
    .insert(categories)
    .values({
      name: body.name,
      slug: body.slug,
      displayOrder: body.displayOrder,
      isActive: body.isActive,
    })
    .returning({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      displayOrder: categories.displayOrder,
      isActive: categories.isActive,
      createdAt: categories.createdAt,
    })

  return c.json(toAdminCategory(created), 201)
}

export const updateAdminCategoryHandler: RouteHandler<typeof updateAdminCategoryRoute> = async (
  c,
) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const [found] = await db
    .select({
      id: categories.id,
      slug: categories.slug,
    })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1)

  if (!found) {
    return c.json({ code: 'admin_category_not_found', error: 'Category not found' }, 404)
  }

  if (body.slug && body.slug !== found.slug) {
    const [existingSlug] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, body.slug))
      .limit(1)

    if (existingSlug) {
      return c.json(
        { code: 'admin_category_slug_conflict', error: 'Category slug already exists' },
        409,
      )
    }
  }

  const [updated] = await db.update(categories).set(body).where(eq(categories.id, id)).returning({
    id: categories.id,
    name: categories.name,
    slug: categories.slug,
    displayOrder: categories.displayOrder,
    isActive: categories.isActive,
    createdAt: categories.createdAt,
  })

  return c.json(toAdminCategory(updated), 200)
}

export const deleteAdminCategoryHandler: RouteHandler<typeof deleteAdminCategoryRoute> = async (
  c,
) => {
  const { id } = c.req.valid('param')

  const [found] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1)

  if (!found) {
    return c.json({ code: 'admin_category_not_found', error: 'Category not found' }, 404)
  }

  const [referencedProduct] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.categoryId, id))
    .limit(1)

  if (referencedProduct) {
    return c.json(
      {
        code: 'admin_category_has_products',
        error: 'Category has products',
      },
      409,
    )
  }

  await db.delete(categories).where(eq(categories.id, id))

  return c.body(null, 204)
}
