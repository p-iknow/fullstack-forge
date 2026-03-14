import type { CatalogCategory } from './categories'
import { getFallbackProductImageUrls } from '~/lib/product-image'

export type StockDisplay = 'in_stock' | 'low_stock' | 'out_of_stock'

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
  void productId
  return getFallbackProductImageUrls()
}

export const getAvailableStock = (onHand: number | null, reserved: number | null) => {
  const safeOnHand = Math.max(0, onHand ?? 0)
  const safeReserved = Math.max(0, reserved ?? 0)
  return Math.max(0, safeOnHand - safeReserved)
}

export const getStockDisplay = (available: number, safetyThreshold: number): StockDisplay => {
  if (available === 0) {
    return 'out_of_stock'
  }

  if (available <= safetyThreshold) {
    return 'low_stock'
  }

  return 'in_stock'
}

export const getCanPurchase = (args: {
  isActive: boolean
  availableStock: number
  category: CatalogCategory | null
}) => {
  const { isActive, availableStock, category } = args
  return isActive && (category?.isActive ?? false) && availableStock > 0
}
