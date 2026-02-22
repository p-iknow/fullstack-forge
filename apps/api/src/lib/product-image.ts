import { publicUrl } from '~/lib/s3-client'

export const PRODUCT_IMAGE_FALLBACK_THUMB_KEY = 'fallback/product-thumb.webp'
export const PRODUCT_IMAGE_FALLBACK_DETAIL_KEY = 'fallback/product-detail.webp'

export const getFallbackProductImageUrls = () => {
  return {
    thumbUrl: publicUrl(PRODUCT_IMAGE_FALLBACK_THUMB_KEY),
    detailUrl: publicUrl(PRODUCT_IMAGE_FALLBACK_DETAIL_KEY),
  }
}
