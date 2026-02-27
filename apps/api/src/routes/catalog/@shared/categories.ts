import { asc, eq } from 'drizzle-orm'
import { db } from '~/db/client'
import { categories } from '~/db/schema/index'

export type CatalogCategory = {
  id: string
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
}

const mapCatalogCategory = (category: {
  id: string
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
}): CatalogCategory => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  displayOrder: category.displayOrder,
  isActive: category.isActive,
})

export const getDbCategories = async (): Promise<CatalogCategory[]> => {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      displayOrder: categories.displayOrder,
      isActive: categories.isActive,
    })
    .from(categories)
    .orderBy(asc(categories.displayOrder))

  return rows.map(mapCatalogCategory)
}

export const getDbCategoryById = async (
  categoryId: string | null | undefined,
): Promise<CatalogCategory | null> => {
  if (!categoryId) {
    return null
  }

  const [row] = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      displayOrder: categories.displayOrder,
      isActive: categories.isActive,
    })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1)

  return row ? mapCatalogCategory(row) : null
}

export const getCatalogCategoryById = (
  categoryList: CatalogCategory[],
  categoryId: string | null | undefined,
): CatalogCategory | null => {
  if (!categoryId) {
    return null
  }

  return categoryList.find((category) => category.id === categoryId) ?? null
}

export const findCatalogCategory = (
  value: string | null | undefined,
  categoryList: CatalogCategory[],
): CatalogCategory | null => {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return null
  }

  return (
    categoryList.find((category) => {
      return (
        category.id.toLowerCase() === normalized ||
        category.slug.toLowerCase() === normalized ||
        category.name.toLowerCase() === normalized
      )
    }) ?? null
  )
}
