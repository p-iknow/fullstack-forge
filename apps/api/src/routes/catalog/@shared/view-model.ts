import type { CatalogCategory } from './categories'
import { publicUrl } from '~/lib/s3-client'

type ProductStatus = 'active' | 'low_stock' | 'out_of_stock' | 'discontinued'

const fallbackBrandByCategorySlug: Record<string, string> = {
  'convenience-food': 'Quick Pantry',
  beverage: 'Fresh Drop',
  hygiene: 'Clean Basic',
  'laundry-cleaning': 'Spark Home',
  'pet-supplies': 'Pet Daily',
  'self-care': 'Calm Ritual',
}

export const getProductSku = (productId: string) => {
  const compact = productId.replaceAll('-', '').slice(0, 12).toUpperCase()
  return `SKU-${compact}`
}

export const getProductBrand = (category: CatalogCategory | null, productName: string) => {
  if (!category) {
    return 'Fullstack Forge'
  }

  const preferredBrand = fallbackBrandByCategorySlug[category.slug]
  if (preferredBrand) {
    return preferredBrand
  }

  const firstToken = productName.trim().split(/\s+/u)[0]
  if (firstToken) {
    return `${firstToken} Select`
  }

  return 'Fullstack Forge'
}

export const getProductWeight = (price: number) => {
  const base = 250
  const step = Math.max(0, Math.floor(price / 250))
  return base + step * 10
}

export const getProductImageUrls = (productId: string) => {
  const suffix = productId.replaceAll('-', '').slice(0, 10).toLowerCase()
  return {
    thumbUrl: publicUrl(`catalog/sku-${suffix}-thumb.webp`),
    detailUrl: publicUrl(`catalog/sku-${suffix}-detail.webp`),
  }
}

export const getAvailableStock = (onHand: number | null, reserved: number | null) => {
  const safeOnHand = Math.max(0, onHand ?? 0)
  const safeReserved = Math.max(0, reserved ?? 0)
  return Math.max(0, safeOnHand - safeReserved)
}

export const getCanPurchase = (args: {
  status: ProductStatus
  availableStock: number
  category: CatalogCategory | null
}) => {
  const { status, availableStock, category } = args
  const statusSellable = status === 'active' || status === 'low_stock'
  const categorySellable = category?.isActive ?? false
  return statusSellable && categorySellable && availableStock > 0
}
