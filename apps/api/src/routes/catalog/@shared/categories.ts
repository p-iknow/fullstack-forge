export type CatalogCategory = {
  id: string
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
}

export const catalogCategories: CatalogCategory[] = [
  {
    id: 'cat-1',
    name: '상온 간편식',
    slug: 'convenience-food',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'cat-2',
    name: '음료',
    slug: 'beverage',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'cat-3',
    name: '위생용품',
    slug: 'hygiene',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'cat-4',
    name: '세탁/청소',
    slug: 'laundry-cleaning',
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'cat-5',
    name: '반려소모품',
    slug: 'pet-supplies',
    displayOrder: 5,
    isActive: true,
  },
  {
    id: 'cat-6',
    name: '셀프케어',
    slug: 'self-care',
    displayOrder: 6,
    isActive: true,
  },
]

const categoryById = new Map(catalogCategories.map((category) => [category.id, category]))

export const getCatalogCategoryById = (categoryId: string | null | undefined): CatalogCategory | null => {
  if (!categoryId) {
    return null
  }
  return categoryById.get(categoryId) ?? null
}

export const findCatalogCategory = (value: string | null | undefined): CatalogCategory | null => {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return null
  }

  return (
    catalogCategories.find((category) => {
      return (
        category.id.toLowerCase() === normalized ||
        category.slug.toLowerCase() === normalized ||
        category.name.toLowerCase() === normalized
      )
    }) ?? null
  )
}
