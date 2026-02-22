import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import sharp from 'sharp'

import {
  PRODUCT_IMAGE_FALLBACK_DETAIL_KEY,
  PRODUCT_IMAGE_FALLBACK_THUMB_KEY,
} from '~/lib/product-image'
import { MINIO_BUCKET, MINIO_ENDPOINT, s3 } from '~/lib/s3-client'

import { type SeedProduct, PRODUCT_CATALOG } from './seed-product-catalog'

const THUMB_SIZE = { width: 400, height: 400 }
const DETAIL_SIZE = { width: 800, height: 600 }

type ImageGenerator = (
  product: SeedProduct,
  productIndex: number,
  variant: 'thumb' | 'detail',
) => Promise<Buffer>

const createImageGenerator = (): ImageGenerator => async (product, productIndex, variant) => {
  const { width, height } = variant === 'thumb' ? THUMB_SIZE : DETAIL_SIZE
  const svg = buildSvg(width, height, product.name, product.brand, product.categorySlug, variant, productIndex)
  return generateWebp(svg, width, height)
}

/* ------------------------------------------------------------------ */
/*  Product visual mapping (shape + brand color per product index)     */
/* ------------------------------------------------------------------ */

type PackagingShape =
  | 'bottle'
  | 'can'
  | 'packet'
  | 'box'
  | 'cup'
  | 'bag'
  | 'tube'
  | 'pump'
  | 'jar'
  | 'spray'

type ProductVisual = { shape: PackagingShape; color: string }

const PRODUCT_VISUALS: ProductVisual[] = [
  /* convenience-food */
  { shape: 'packet', color: '#D32F2F' }, // 0  신라면
  { shape: 'box', color: '#1565C0' }, //    1  햇반
  { shape: 'can', color: '#1976D2' }, //    2  참치캔
  { shape: 'packet', color: '#33691E' }, // 3  짜파게티
  { shape: 'cup', color: '#E53935' }, //    4  컵누들
  { shape: 'bag', color: '#2E7D32' }, //    5  비비고
  { shape: 'box', color: '#F9A825' }, //    6  카레여왕
  { shape: 'can', color: '#1565C0' }, //    7  스팸
  /* beverage */
  { shape: 'bottle', color: '#00ACC1' }, // 8  삼다수
  { shape: 'bottle', color: '#D32F2F' }, // 9  코카콜라
  { shape: 'bottle', color: '#1B5E20' }, // 10 스타벅스
  { shape: 'bottle', color: '#EF6C00' }, // 11 비타500
  { shape: 'bottle', color: '#1976D2' }, // 12 포카리스웨트
  { shape: 'can', color: '#1565C0' }, //    13 밀키스
  { shape: 'bottle', color: '#2E7D32' }, // 14 토레타
  { shape: 'bottle', color: '#00695C' }, // 15 칠성사이다
  /* hygiene */
  { shape: 'box', color: '#42A5F5' }, //    16 미용티슈
  { shape: 'pump', color: '#43A047' }, //   17 핸드워시
  { shape: 'box', color: '#ECEFF1' }, //    18 마스크
  { shape: 'box', color: '#26A69A' }, //    19 물티슈
  { shape: 'tube', color: '#E53935' }, //   20 치약
  { shape: 'box', color: '#1976D2' }, //    21 칫솔
  { shape: 'box', color: '#263238' }, //    22 면도기
  { shape: 'pump', color: '#66BB6A' }, //   23 손소독제
  /* laundry-cleaning */
  { shape: 'bottle', color: '#7B1FA2' }, // 24 피죤
  { shape: 'bottle', color: '#1565C0' }, // 25 다우니
  { shape: 'box', color: '#2E7D32' }, //    26 옥시크린
  { shape: 'box', color: '#00897B' }, //    27 매직블럭
  { shape: 'bottle', color: '#F9A825' }, // 28 퐁퐁
  { shape: 'bottle', color: '#C62828' }, // 29 유한락스
  { shape: 'box', color: '#42A5F5' }, //    30 청소포
  { shape: 'spray', color: '#1976D2' }, //  31 페브리즈
  /* pet-supplies */
  { shape: 'bag', color: '#795548' }, //    32 하림
  { shape: 'can', color: '#7B1FA2' }, //    33 위스카스
  { shape: 'bag', color: '#8D6E63' }, //    34 져키빌
  { shape: 'bag', color: '#2E7D32' }, //    35 에버크린
  { shape: 'box', color: '#29B6F6' }, //    36 반려견패드
  { shape: 'tube', color: '#EC407A' }, //   37 츄르
  { shape: 'pump', color: '#0288D1' }, //   38 강아지샴푸
  { shape: 'box', color: '#66BB6A' }, //    39 캣닢볼
  /* self-care */
  { shape: 'tube', color: '#2E7D32' }, //   40 선크림
  { shape: 'jar', color: '#1565C0' }, //    41 수분크림
  { shape: 'bottle', color: '#FF8F00' }, // 42 에센스
  { shape: 'bottle', color: '#EF6C00' }, // 43 비타민C
  { shape: 'jar', color: '#1565C0' }, //    44 립밤
  { shape: 'box', color: '#0D47A1' }, //    45 마스크팩
  { shape: 'pump', color: '#F5F5F5' }, //   46 바디로션
  { shape: 'tube', color: '#FDD835' }, //   47 핸드크림
]

/* ------------------------------------------------------------------ */
/*  Color helpers                                                      */
/* ------------------------------------------------------------------ */

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')}`

const lighten = (hex: string, amount: number): string => {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount)
}

const darken = (hex: string, amount: number): string => {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}

/* ------------------------------------------------------------------ */
/*  SVG defs (gradients + shadow)                                      */
/* ------------------------------------------------------------------ */

const buildDefs = (color: string, id: string): string => {
  const light = lighten(color, 0.35)
  const dark = darken(color, 0.25)
  const veryLight = lighten(color, 0.7)
  const veryDark = darken(color, 0.4)
  return `<defs>
    <linearGradient id="bodyGrad-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${dark}"/>
      <stop offset="22%" stop-color="${light}"/>
      <stop offset="42%" stop-color="${veryLight}"/>
      <stop offset="68%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${veryDark}"/>
    </linearGradient>
    <linearGradient id="flatGrad-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${light}"/>
      <stop offset="50%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
    <linearGradient id="metalGrad-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${darken(color, 0.3)}"/>
      <stop offset="20%" stop-color="${lighten(color, 0.52)}"/>
      <stop offset="35%" stop-color="${lighten(color, 0.68)}"/>
      <stop offset="52%" stop-color="${lighten(color, 0.2)}"/>
      <stop offset="70%" stop-color="${color}"/>
      <stop offset="85%" stop-color="${darken(color, 0.15)}"/>
      <stop offset="100%" stop-color="${darken(color, 0.35)}"/>
    </linearGradient>
    <linearGradient id="sheen-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${veryLight}" stop-opacity="0.4"/>
      <stop offset="20%" stop-color="${veryLight}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${dark}" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="capGrad-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${lighten(color, 0.35)}"/>
      <stop offset="40%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${darken(color, 0.25)}"/>
    </linearGradient>
    <radialGradient id="shadow-${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000" stop-opacity="0.22"/>
      <stop offset="58%" stop-color="#000" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="shadowInner-${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bgGrad-${id}" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E8E8E8"/>
    </radialGradient>
    <radialGradient id="vignette-${id}" cx="50%" cy="50%" r="70%">
      <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.08"/>
    </radialGradient>
    <pattern id="paperTex-${id}" width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="#FFFFFF" fill-opacity="0"/>
      <circle cx="2" cy="3" r="0.7" fill="#000" fill-opacity="0.08"/>
      <circle cx="8" cy="5" r="0.6" fill="#000" fill-opacity="0.06"/>
      <circle cx="12" cy="11" r="0.7" fill="#000" fill-opacity="0.07"/>
      <line x1="0" y1="8" x2="14" y2="9" stroke="#FFF" stroke-opacity="0.08" stroke-width="0.6"/>
    </pattern>
    <pattern id="plasticTex-${id}" width="18" height="18" patternUnits="userSpaceOnUse">
      <rect width="18" height="18" fill="#FFFFFF" fill-opacity="0"/>
      <path d="M1,7 C4,5 8,5 11,7" stroke="#FFF" stroke-opacity="0.09" stroke-width="0.6" fill="none"/>
      <path d="M6,14 C9,12 13,12 16,14" stroke="#000" stroke-opacity="0.06" stroke-width="0.6" fill="none"/>
    </pattern>
  </defs>`
}

/* ------------------------------------------------------------------ */
/*  Label (white rect + product name + brand)                          */
/* ------------------------------------------------------------------ */

const buildLabel = (
  cx: number,
  y: number,
  w: number,
  h: number,
  name: string,
  brand: string,
  nameFontSize: number,
  brandFontSize: number,
  accent: string,
): string => {
  const estimateTextUnits = (text: string): number => {
    let units = 0
    for (const ch of text) {
      if (ch === ' ') {
        units += 0.35
      } else if (/[A-Z]/.test(ch)) {
        units += 0.68
      } else if (/[a-z]/.test(ch)) {
        units += 0.58
      } else if (/[0-9]/.test(ch)) {
        units += 0.56
      } else {
        units += 1
      }
    }
    return units
  }

  const wrapByUnits = (text: string, maxUnits: number): string[] => {
    const lines: string[] = []
    let line = ''
    let used = 0

    for (const ch of text) {
      const chUnits = estimateTextUnits(ch)
      if (used + chUnits > maxUnits && line.length > 0) {
        lines.push(line.trimEnd())
        line = ch
        used = chUnits
      } else {
        line += ch
        used += chUnits
      }
    }

    if (line.length > 0) lines.push(line.trimEnd())
    return lines.length === 0 ? [''] : lines
  }

  const contentWidth = Math.max(10, w - 12)

  const fitNameIntoTwoLines = (): { lines: string[]; size: number } => {
    const minScale = 0.5
    const step = 0.05
    for (let scale = 1; scale >= minScale; scale -= step) {
      const size = Math.max(6.2, nameFontSize * scale)
      const maxUnits = contentWidth / Math.max(1, size * 0.88)
      const lines = wrapByUnits(name, maxUnits)
      if (lines.length <= 2) return { lines, size }
    }

    const fallbackSize = Math.max(6, nameFontSize * 0.5)
    const maxUnits = contentWidth / Math.max(1, fallbackSize * 0.88)
    const rawLines = wrapByUnits(name, maxUnits)
    if (rawLines.length <= 2) return { lines: rawLines, size: fallbackSize }
    return { lines: [rawLines[0] ?? '', rawLines.slice(1).join('')], size: fallbackSize }
  }

  const fitBrandSingleLine = (): { text: string; size: number } => {
    const minScale = 0.55
    const step = 0.05
    for (let scale = 1; scale >= minScale; scale -= step) {
      const size = Math.max(6, brandFontSize * scale)
      const maxUnits = contentWidth / Math.max(1, size * 0.82)
      if (estimateTextUnits(brand) <= maxUnits) return { text: brand, size }
    }

    const fallbackSize = Math.max(6, brandFontSize * 0.55)
    const maxUnits = contentWidth / Math.max(1, fallbackSize * 0.82)
    let out = ''
    let used = 0
    const ellipsisUnits = 0.9
    for (const ch of brand) {
      const chUnits = estimateTextUnits(ch)
      if (used + chUnits + ellipsisUnits > maxUnits) break
      out += ch
      used += chUnits
    }
    return { text: out.trimEnd() + '…', size: fallbackSize }
  }

  const { lines: nameLines, size: safeNameSize } = fitNameIntoTwoLines()
  const { text: safeBrand, size: safeBrandSize } = fitBrandSingleLine()

  const isTwoLineName = nameLines.length > 1
  const nameY1 = y + h * (isTwoLineName ? 0.28 : 0.36)
  const nameY2 = y + h * 0.44
  const separatorY = y + h * (isTwoLineName ? 0.58 : 0.54)
  const brandY = y + h * (isTwoLineName ? 0.76 : 0.73)

  const x = cx - w / 2
  return `<rect x="${x + 1.5}" y="${y + 1.5}" width="${w}" height="${h}" rx="5" fill="#000" fill-opacity="0.06"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#FFF" fill-opacity="0.95" stroke="${accent}" stroke-width="1.2" stroke-opacity="0.24"/>
  <rect x="${x + 4}" y="${y + 2}" width="${w - 8}" height="2.5" rx="1" fill="${accent}" fill-opacity="0.5"/>
  <text x="${cx}" y="${nameY1}" font-family="sans-serif" font-size="${safeNameSize}" font-weight="bold" fill="#222" text-anchor="middle" dominant-baseline="central">${escapeXml(nameLines[0] ?? '')}</text>
  ${
    isTwoLineName
      ? `<text x="${cx}" y="${nameY2}" font-family="sans-serif" font-size="${safeNameSize}" font-weight="bold" fill="#222" text-anchor="middle" dominant-baseline="central">${escapeXml(nameLines[1] ?? '')}</text>`
      : ''
  }
  <line x1="${x + w * 0.12}" y1="${separatorY}" x2="${x + w * 0.88}" y2="${separatorY}" stroke="#DDD" stroke-width="0.7"/>
  <text x="${cx}" y="${brandY}" font-family="sans-serif" font-size="${safeBrandSize}" fill="#888" text-anchor="middle" dominant-baseline="central">${escapeXml(safeBrand)}</text>`
}

/* ------------------------------------------------------------------ */
/*  Floor shadow                                                       */
/* ------------------------------------------------------------------ */

const buildFloorShadow = (cx: number, bottom: number, w: number, id: string): string =>
  `<ellipse cx="${cx}" cy="${bottom + 12}" rx="${w * 0.5}" ry="14" fill="url(#shadow-${id})" opacity="0.35"/>
  <ellipse cx="${cx}" cy="${bottom + 7}" rx="${w * 0.32}" ry="6" fill="url(#shadowInner-${id})" opacity="0.5"/>`

const buildBaseReflection = (
  cx: number,
  bottom: number,
  w: number,
  h: number,
  color: string,
  opacity = 0.12,
): string =>
  `<rect x="${cx - w / 2}" y="${bottom + 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${lighten(color, 0.55)}" fill-opacity="${opacity}"/>
  <rect x="${cx - w / 3}" y="${bottom + 3}" width="${w / 1.5}" height="${h * 0.5}" rx="${h / 3}" fill="#FFF" fill-opacity="${opacity * 0.6}"/>`

/* ------------------------------------------------------------------ */
/*  Shape renderers                                                    */
/* ------------------------------------------------------------------ */

type ShapeCtx = {
  w: number
  h: number
  cx: number
  cy: number
  name: string
  brand: string
  color: string
  id: string
  variant: 'thumb' | 'detail'
}

const s = (ctx: ShapeCtx): number => (ctx.variant === 'thumb' ? 1.15 : 1.4)

/* ----- bottle ----- */
const renderBottle = (ctx: ShapeCtx): string => {
  const sc = s(ctx)
  const bw = 100 * sc
  const bh = 194 * sc
  const nw = 30 * sc
  const nh = 28 * sc
  const capH = 22 * sc
  const capW = 36 * sc
  const shoulderH = 26 * sc
  const collarH = 6 * sc
  const totalH = capH + collarH + nh + shoulderH + bh
  const top = ctx.cy - totalH / 2
  const { cx, id, name, brand } = ctx
  const neckTop = top + capH + collarH
  const shoulderTop = neckTop + nh
  const bodyTop = shoulderTop + shoulderH
  const shoulderPath = `M${cx - nw / 2},${shoulderTop} C${cx - nw / 2},${shoulderTop + shoulderH * 0.7} ${cx - bw / 2},${shoulderTop + shoulderH} ${cx - bw / 2},${shoulderTop + shoulderH} L${cx + bw / 2},${shoulderTop + shoulderH} C${cx + bw / 2},${shoulderTop + shoulderH} ${cx + nw / 2},${shoulderTop + shoulderH * 0.7} ${cx + nw / 2},${shoulderTop} Z`
  return `${buildFloorShadow(cx, top + totalH, bw, id)}
  <rect x="${cx - capW / 2}" y="${top}" width="${capW}" height="${capH}" rx="4" fill="url(#capGrad-${id})"/>
  <line x1="${cx - capW / 2 + 3}" y1="${top + capH * 0.35}" x2="${cx + capW / 2 - 3}" y2="${top + capH * 0.35}" stroke="${darken(ctx.color, 0.2)}" stroke-width="0.7" stroke-opacity="0.5"/>
  <line x1="${cx - capW / 2 + 3}" y1="${top + capH * 0.65}" x2="${cx + capW / 2 - 3}" y2="${top + capH * 0.65}" stroke="${darken(ctx.color, 0.2)}" stroke-width="0.7" stroke-opacity="0.5"/>
  <rect x="${cx - capW / 2 - 2}" y="${top + capH}" width="${capW + 4}" height="${collarH}" rx="2" fill="${darken(ctx.color, 0.1)}"/>
  <rect x="${cx - nw / 2}" y="${neckTop}" width="${nw}" height="${nh}" fill="url(#bodyGrad-${id})"/>
  <path d="${shoulderPath}" fill="url(#bodyGrad-${id})"/>
  <path d="${shoulderPath}" fill="url(#sheen-${id})"/>
  <rect x="${cx - bw / 2}" y="${bodyTop}" width="${bw}" height="${bh}" rx="${12 * sc}" fill="url(#bodyGrad-${id})"/>
  <rect x="${cx - bw / 2}" y="${bodyTop}" width="${bw}" height="${bh}" rx="${12 * sc}" fill="url(#sheen-${id})"/>
  <rect x="${cx - bw / 2}" y="${bodyTop}" width="${bw}" height="${bh}" rx="${12 * sc}" fill="url(#plasticTex-${id})" fill-opacity="0.28"/>
  <rect x="${cx - bw * 0.35}" y="${bodyTop + bh * 0.52}" width="${bw * 0.7}" height="${bh * 0.32}" rx="${8 * sc}" fill="#FFF" fill-opacity="0.07"/>
  <rect x="${cx - bw * 0.18}" y="${bodyTop + bh * 0.04}" width="${bw * 0.07}" height="${bh * 0.92}" rx="${bw * 0.03}" fill="#FFF" fill-opacity="0.28"/>
  ${buildBaseReflection(cx, top + totalH, bw * 0.6, 8 * sc, ctx.color, 0.11)}
  ${buildLabel(cx, bodyTop + bh * 0.15, bw * 0.85, bh * 0.45, name, brand, 13 * sc, 10 * sc, ctx.color)}`
}

/* ----- can ----- */
const renderCan = (ctx: ShapeCtx): string => {
  const sc = s(ctx)
  const cw = 110 * sc
  const ch = 170 * sc
  const ery = 16 * sc
  const top = ctx.cy - ch / 2
  const { cx, id, name, brand } = ctx
  return `${buildFloorShadow(cx, top + ch + ery, cw, id)}
  <rect x="${cx - cw / 2}" y="${top}" width="${cw}" height="${ch}" fill="url(#metalGrad-${id})"/>
  <rect x="${cx - cw / 2}" y="${top}" width="${cw}" height="${ch}" fill="url(#sheen-${id})"/>
  <rect x="${cx - cw / 2}" y="${top}" width="${cw}" height="${ch}" fill="url(#plasticTex-${id})" fill-opacity="0.18"/>
  <ellipse cx="${cx}" cy="${top}" rx="${cw / 2}" ry="${ery}" fill="${lighten(ctx.color, 0.3)}"/>
  <ellipse cx="${cx}" cy="${top}" rx="${cw / 2}" ry="${ery}" fill="none" stroke="${darken(ctx.color, 0.2)}" stroke-width="1.5"/>
  <ellipse cx="${cx}" cy="${top + 4 * sc}" rx="${cw / 2 - 3}" ry="${ery * 0.62}" fill="none" stroke="${darken(ctx.color, 0.15)}" stroke-width="0.8" stroke-opacity="0.45"/>
  <ellipse cx="${cx + 4 * sc}" cy="${top - ery * 0.15}" rx="${9 * sc}" ry="${4 * sc}" fill="${lighten(ctx.color, 0.5)}" stroke="${darken(ctx.color, 0.15)}" stroke-width="0.8"/>
  <circle cx="${cx + 4 * sc}" cy="${top - ery * 0.15}" r="${2.3 * sc}" fill="none" stroke="${darken(ctx.color, 0.2)}" stroke-width="0.7"/>
  <ellipse cx="${cx}" cy="${top + ch}" rx="${cw / 2}" ry="${ery}" fill="${darken(ctx.color, 0.15)}"/>
  <rect x="${cx - cw * 0.16}" y="${top + ch * 0.04}" width="${cw * 0.06}" height="${ch * 0.92}" rx="${cw * 0.03}" fill="#FFF" fill-opacity="0.34"/>
  ${buildBaseReflection(cx, top + ch + ery, cw * 0.58, 7 * sc, ctx.color, 0.1)}
  ${buildLabel(cx, top + ch * 0.22, cw * 0.8, ch * 0.4, name, brand, 12 * sc, 9 * sc, ctx.color)}`
}

/* ----- packet ----- */
const renderPacket = (ctx: ShapeCtx): string => {
  const sc = s(ctx)
  const pw = 140 * sc
  const ph = 170 * sc
  const sealH = 14 * sc
  const top = ctx.cy - (ph + sealH) / 2
  const { cx, id, name, brand } = ctx
  const left = cx - pw / 2
  const zigN = 10
  const zigW = pw / zigN
  let zigPath = `M${left},${top + sealH}`
  for (let i = 0; i < zigN; i++) {
    const xBase = left + i * zigW
    zigPath += ` L${xBase + zigW / 2},${top} L${xBase + zigW},${top + sealH}`
  }
  const bulge = 8 * sc
  zigPath += ` C${left + pw + bulge},${top + sealH + ph * 0.3} ${left + pw + bulge},${top + sealH + ph * 0.7} ${left + pw},${top + sealH + ph}`
  zigPath += ` L${left},${top + sealH + ph}`
  zigPath += ` C${left - bulge},${top + sealH + ph * 0.7} ${left - bulge},${top + sealH + ph * 0.3} ${left},${top + sealH} Z`
  return `${buildFloorShadow(cx, top + sealH + ph, pw, id)}
  <path d="${zigPath}" fill="url(#flatGrad-${id})"/>
  <path d="${zigPath}" fill="url(#sheen-${id})"/>
  <path d="${zigPath}" fill="url(#paperTex-${id})" fill-opacity="0.35"/>
  <rect x="${left + 2}" y="${top + sealH}" width="${pw - 4}" height="${ph * 0.12}" fill="${darken(ctx.color, 0.12)}" fill-opacity="0.6"/>
  <rect x="${left + 2}" y="${top + sealH + ph * 0.88}" width="${pw - 4}" height="${ph * 0.12}" fill="${darken(ctx.color, 0.12)}" fill-opacity="0.4"/>
  ${buildLabel(cx, top + sealH + ph * 0.18, pw * 0.82, ph * 0.48, name, brand, 14 * sc, 10 * sc, ctx.color)}`
}

/* ----- box ----- */
const renderBox = (ctx: ShapeCtx): string => {
  const sc = s(ctx)
  const bw = 130 * sc
  const bh = 150 * sc
  const depth = 30 * sc
  const top = ctx.cy - (bh + depth) / 2
  const { cx, id, name, brand, color } = ctx
  const left = cx - bw / 2
  const front = `<rect x="${left}" y="${top + depth}" width="${bw}" height="${bh}" fill="url(#flatGrad-${id})"/>`
  const topFace = `<path d="M${left},${top + depth} L${left + depth * 0.7},${top} L${left + bw + depth * 0.7},${top} L${left + bw},${top + depth} Z" fill="${lighten(color, 0.25)}"/>`
  const rightFace = `<path d="M${left + bw},${top + depth} L${left + bw + depth * 0.7},${top} L${left + bw + depth * 0.7},${top + bh} L${left + bw},${top + depth + bh} Z" fill="${darken(color, 0.15)}"/>`
  const flapLine = `<line x1="${left + bw * 0.5 + depth * 0.35}" y1="${top}" x2="${left + bw * 0.5}" y2="${top + depth}" stroke="${darken(color, 0.08)}" stroke-width="0.8" stroke-opacity="0.45" stroke-dasharray="4,3"/>`
  const edgeBottom = `<line x1="${left}" y1="${top + depth + bh}" x2="${left + bw}" y2="${top + depth + bh}" stroke="${darken(color, 0.2)}" stroke-width="1" stroke-opacity="0.3"/>`
  return `${buildFloorShadow(cx + depth * 0.3, top + depth + bh, bw, id)}
  ${rightFace}
  ${front}
  ${topFace}
  ${flapLine}
  ${edgeBottom}
  <rect x="${left}" y="${top + depth}" width="${bw}" height="${bh}" fill="url(#sheen-${id})"/>
  <rect x="${left}" y="${top + depth}" width="${bw}" height="${bh}" fill="url(#paperTex-${id})" fill-opacity="0.38"/>
  ${buildBaseReflection(cx + depth * 0.2, top + depth + bh, bw * 0.56, 7 * sc, ctx.color, 0.08)}
  ${buildLabel(cx, top + depth + bh * 0.2, bw * 0.82, bh * 0.45, name, brand, 13 * sc, 10 * sc, ctx.color)}`
}

/* ----- cup ----- */
const renderCup = (ctx: ShapeCtx): string => {
  const sc = s(ctx)
  const topW = 110 * sc
  const botW = 80 * sc
  const cupH = 160 * sc
  const lidH = 10 * sc
  const rimH = 6 * sc
  const top = ctx.cy - (cupH + lidH + rimH) / 2
  const { cx, id, name, brand } = ctx
  const bodyPath = `M${cx - topW / 2},${top + rimH + lidH} C${cx - topW / 2 - 6 * sc},${top + rimH + lidH + cupH * 0.4} ${cx - botW / 2 - 6 * sc},${top + rimH + lidH + cupH * 0.7} ${cx - botW / 2},${top + rimH + lidH + cupH} L${cx + botW / 2},${top + rimH + lidH + cupH} C${cx + botW / 2 + 6 * sc},${top + rimH + lidH + cupH * 0.7} ${cx + topW / 2 + 6 * sc},${top + rimH + lidH + cupH * 0.4} ${cx + topW / 2},${top + rimH + lidH} Z`
  return `${buildFloorShadow(cx, top + rimH + lidH + cupH, botW, id)}
  <path d="${bodyPath}" fill="url(#bodyGrad-${id})"/>
  <path d="${bodyPath}" fill="url(#sheen-${id})"/>
  <rect x="${cx - topW / 2}" y="${top + rimH}" width="${topW}" height="${lidH}" fill="${lighten(ctx.color, 0.45)}"/>
  <rect x="${cx - (topW + 10 * sc) / 2}" y="${top}" width="${topW + 10 * sc}" height="${rimH}" rx="3" fill="${lighten(ctx.color, 0.35)}"/>
  <rect x="${cx - topW * 0.16}" y="${top + rimH + lidH + cupH * 0.06}" width="${topW * 0.06}" height="${cupH * 0.84}" rx="${topW * 0.03}" fill="#FFF" fill-opacity="0.22"/>
  ${buildLabel(cx, top + rimH + lidH + cupH * 0.2, topW * 0.75, cupH * 0.4, name, brand, 12 * sc, 9 * sc, ctx.color)}`
}

/* ----- bag ----- */
const renderBag = (ctx: ShapeCtx): string => {
  const sc = s(ctx)
  const topW = 100 * sc
  const botW = 130 * sc
  const bagH = 180 * sc
  const sealH = 12 * sc
  const top = ctx.cy - (bagH + sealH) / 2
  const { cx, id, name, brand } = ctx
  const bodyPath = `M${cx - topW / 2},${top + sealH} L${cx + topW / 2},${top + sealH} C${cx + topW / 2 + 4 * sc},${top + sealH + bagH * 0.25} ${cx + botW / 2 - 4 * sc},${top + sealH + bagH * 0.5} ${cx + botW / 2},${top + sealH + bagH} L${cx - botW / 2},${top + sealH + bagH} C${cx - botW / 2 + 4 * sc},${top + sealH + bagH * 0.5} ${cx - topW / 2 - 4 * sc},${top + sealH + bagH * 0.25} ${cx - topW / 2},${top + sealH} Z`
  const seal = `<rect x="${cx - topW / 2}" y="${top}" width="${topW}" height="${sealH}" fill="${darken(ctx.color, 0.15)}"/>`
  return `${buildFloorShadow(cx, top + sealH + bagH, botW, id)}
  <path d="${bodyPath}" fill="url(#flatGrad-${id})"/>
  <path d="${bodyPath}" fill="url(#sheen-${id})"/>
  <path d="${bodyPath}" fill="url(#paperTex-${id})" fill-opacity="0.28"/>
  ${seal}
  <rect x="${cx - topW / 2}" y="${top + sealH}" width="${topW}" height="${6 * sc}" fill="${lighten(ctx.color, 0.15)}"/>
  <line x1="${cx - botW / 2 + 8}" y1="${top + sealH + bagH - 12 * sc}" x2="${cx + botW / 2 - 8}" y2="${top + sealH + bagH - 12 * sc}" stroke="${darken(ctx.color, 0.12)}" stroke-width="0.8" stroke-opacity="0.35" stroke-dasharray="3,2"/>
  ${buildBaseReflection(cx, top + sealH + bagH, botW * 0.54, 7 * sc, ctx.color, 0.08)}
  ${buildLabel(cx, top + sealH + bagH * 0.18, botW * 0.75, bagH * 0.42, name, brand, 13 * sc, 10 * sc, ctx.color)}`
}

/* ----- tube ----- */
const renderTube = (ctx: ShapeCtx): string => {
  const sc = s(ctx)
  const tw = 70 * sc
  const th = 180 * sc
  const capW = 34 * sc
  const capH = 26 * sc
  const crimpH = 16 * sc
  const totalH = capH + th + crimpH
  const top = ctx.cy - totalH / 2
  const { cx, id, name, brand } = ctx
  const cap = `<rect x="${cx - capW / 2}" y="${top}" width="${capW}" height="${capH}" rx="4" fill="url(#capGrad-${id})"/>`
  const bodyPath = `M${cx - capW / 2},${top + capH} C${cx - capW / 2},${top + capH + th * 0.08} ${cx - tw / 2},${top + capH + th * 0.2} ${cx - tw / 2},${top + capH + th * 0.3} L${cx - tw / 2},${top + capH + th} L${cx + tw / 2},${top + capH + th} L${cx + tw / 2},${top + capH + th * 0.3} C${cx + tw / 2},${top + capH + th * 0.2} ${cx + capW / 2},${top + capH + th * 0.08} ${cx + capW / 2},${top + capH} Z`
  const crimp = `<rect x="${cx - tw / 2 + 4 * sc}" y="${top + capH + th}" width="${tw - 8 * sc}" height="${crimpH}" rx="2" fill="${darken(ctx.color, 0.2)}"/>`
  return `${buildFloorShadow(cx, top + totalH, tw, id)}
  <path d="${bodyPath}" fill="url(#bodyGrad-${id})"/>
  <path d="${bodyPath}" fill="url(#sheen-${id})"/>
  <path d="${bodyPath}" fill="url(#plasticTex-${id})" fill-opacity="0.2"/>
  ${cap}
  ${crimp}
  <line x1="${cx - tw * 0.3}" y1="${top + capH + th + 2}" x2="${cx - tw * 0.3}" y2="${top + capH + th + crimpH - 2}" stroke="${darken(ctx.color, 0.35)}" stroke-width="0.6" stroke-opacity="0.5"/>
  <line x1="${cx}" y1="${top + capH + th + 2}" x2="${cx}" y2="${top + capH + th + crimpH - 2}" stroke="${darken(ctx.color, 0.35)}" stroke-width="0.6" stroke-opacity="0.5"/>
  <line x1="${cx + tw * 0.3}" y1="${top + capH + th + 2}" x2="${cx + tw * 0.3}" y2="${top + capH + th + crimpH - 2}" stroke="${darken(ctx.color, 0.35)}" stroke-width="0.6" stroke-opacity="0.5"/>
  ${buildBaseReflection(cx, top + totalH, tw * 0.55, 7 * sc, ctx.color, 0.1)}
  ${buildLabel(cx, top + capH + th * 0.25, tw * 0.85, th * 0.38, name, brand, 11 * sc, 8 * sc, ctx.color)}`
}

/* ----- pump ----- */
const renderPump = (ctx: ShapeCtx): string => {
  const sc = s(ctx)
  const bw = 100 * sc
  const bh = 140 * sc
  const neckW = 16 * sc
  const neckH = 40 * sc
  const headW = 60 * sc
  const headH = 14 * sc
  const nozzleW = 30 * sc
  const nozzleH = 8 * sc
  const totalH = headH + neckH + bh
  const top = ctx.cy - totalH / 2
  const { cx, id, name, brand, color } = ctx
  const head = `<rect x="${cx - headW / 2}" y="${top}" width="${headW}" height="${headH}" rx="4" fill="${darken(color, 0.1)}"/>`
  const nozzle = `<rect x="${cx - headW / 2 - nozzleW}" y="${top + headH / 2 - nozzleH / 2}" width="${nozzleW}" height="${nozzleH}" rx="3" fill="${darken(color, 0.15)}"/>`
  const nozzleTip = `<circle cx="${cx - headW / 2 - nozzleW}" cy="${top + headH / 2}" r="${nozzleH * 0.55}" fill="${darken(color, 0.24)}"/>`
  const neck = `<rect x="${cx - neckW / 2}" y="${top + headH}" width="${neckW}" height="${neckH}" fill="${darken(color, 0.05)}"/>`
  const collar = `<rect x="${cx - bw * 0.18}" y="${top + headH + neckH}" width="${bw * 0.36}" height="${6 * sc}" rx="2" fill="${darken(color, 0.1)}"/>`
  const body = `<rect x="${cx - bw / 2}" y="${top + headH + neckH}" width="${bw}" height="${bh}" rx="${10 * sc}" fill="url(#bodyGrad-${id})"/>`
  const sheen = `<rect x="${cx - bw / 2}" y="${top + headH + neckH}" width="${bw}" height="${bh}" rx="${10 * sc}" fill="url(#sheen-${id})"/>`
  return `${buildFloorShadow(cx, top + totalH, bw, id)}
  ${body}
  ${sheen}
  ${neck}
  ${collar}
  ${head}
  ${nozzle}
  ${nozzleTip}
  ${buildLabel(cx, top + headH + neckH + bh * 0.15, bw * 0.82, bh * 0.45, name, brand, 12 * sc, 9 * sc, ctx.color)}`
}

/* ----- jar ----- */
const renderJar = (ctx: ShapeCtx): string => {
  const sc = s(ctx)
  const jw = 130 * sc
  const jh = 100 * sc
  const lidW = jw + 6 * sc
  const lidH = 22 * sc
  const totalH = lidH + jh
  const top = ctx.cy - totalH / 2
  const { cx, id, name, brand, color } = ctx
  const lid = `<rect x="${cx - lidW / 2}" y="${top}" width="${lidW}" height="${lidH}" rx="6" fill="${darken(color, 0.1)}"/>`
  const body = `<rect x="${cx - jw / 2}" y="${top + lidH}" width="${jw}" height="${jh}" rx="${20 * sc}" fill="url(#bodyGrad-${id})"/>`
  const sheen = `<rect x="${cx - jw / 2}" y="${top + lidH}" width="${jw}" height="${jh}" rx="${20 * sc}" fill="url(#sheen-${id})"/>`
  const inner = `<rect x="${cx - jw * 0.35}" y="${top + lidH + jh * 0.3}" width="${jw * 0.7}" height="${jh * 0.5}" rx="${12 * sc}" fill="${lighten(color, 0.2)}" fill-opacity="0.14"/>`
  const rim = `<rect x="${cx - jw / 2 + 3}" y="${top + lidH}" width="${jw - 6}" height="${jh * 0.06}" rx="2" fill="#FFF" fill-opacity="0.25"/>`
  return `${buildFloorShadow(cx, top + totalH, jw, id)}
  ${body}
  ${inner}
  ${rim}
  ${sheen}
  <rect x="${cx - jw / 2}" y="${top + lidH}" width="${jw}" height="${jh}" rx="${20 * sc}" fill="url(#plasticTex-${id})" fill-opacity="0.2"/>
  ${lid}
  ${buildBaseReflection(cx, top + totalH, jw * 0.6, 7 * sc, ctx.color, 0.1)}
  ${buildLabel(cx, top + lidH + jh * 0.15, jw * 0.72, jh * 0.55, name, brand, 12 * sc, 9 * sc, ctx.color)}`
}

/* ----- spray ----- */
const renderSpray = (ctx: ShapeCtx): string => {
  const sc = s(ctx)
  const bw = 90 * sc
  const bh = 170 * sc
  const neckW = 24 * sc
  const neckH = 30 * sc
  const triggerW = 40 * sc
  const headH = 20 * sc
  const totalH = headH + neckH + bh
  const top = ctx.cy - totalH / 2
  const { cx, id, name, brand, color } = ctx
  const head = `<rect x="${cx - neckW / 2 - 6 * sc}" y="${top}" width="${neckW + 12 * sc}" height="${headH}" rx="4" fill="${darken(color, 0.15)}"/>`
  const triggerPath = `M${cx - neckW / 2 - 2 * sc},${top + headH} L${cx - neckW / 2 - triggerW},${top + headH} L${cx - neckW / 2 - triggerW},${top + headH + 10 * sc} L${cx - neckW / 2 - 8 * sc},${top + headH + 10 * sc} L${cx - neckW / 2 - 8 * sc},${top + headH + 50 * sc} L${cx - neckW / 2 - 2 * sc},${top + headH + 50 * sc} Z`
  const trigger = `<path d="${triggerPath}" fill="${darken(color, 0.1)}"/>`
  const clip = `<rect x="${cx + neckW / 2 + 3}" y="${top + headH * 0.5}" width="${5 * sc}" height="${4 * sc}" rx="1" fill="${darken(color, 0.2)}" fill-opacity="0.6"/>`
  const neck = `<rect x="${cx - neckW / 2}" y="${top + headH}" width="${neckW}" height="${neckH}" fill="${darken(color, 0.05)}"/>`
  const body = `<rect x="${cx - bw / 2}" y="${top + headH + neckH}" width="${bw}" height="${bh}" rx="${8 * sc}" fill="url(#bodyGrad-${id})"/>`
  const sheen = `<rect x="${cx - bw / 2}" y="${top + headH + neckH}" width="${bw}" height="${bh}" rx="${8 * sc}" fill="url(#sheen-${id})"/>`
  return `${buildFloorShadow(cx, top + totalH, bw, id)}
  ${body}
  ${sheen}
  <rect x="${cx - bw / 2}" y="${top + headH + neckH}" width="${bw}" height="${bh}" rx="${8 * sc}" fill="url(#plasticTex-${id})" fill-opacity="0.2"/>
  ${neck}
  ${head}
  ${trigger}
  ${clip}
  ${buildBaseReflection(cx, top + totalH, bw * 0.56, 7 * sc, ctx.color, 0.1)}
  ${buildLabel(cx, top + headH + neckH + bh * 0.12, bw * 0.8, bh * 0.4, name, brand, 12 * sc, 9 * sc, ctx.color)}`
}

/* ------------------------------------------------------------------ */
/*  Shape dispatch                                                     */
/* ------------------------------------------------------------------ */

const SHAPE_RENDERERS: Record<PackagingShape, (ctx: ShapeCtx) => string> = {
  bottle: renderBottle,
  can: renderCan,
  packet: renderPacket,
  box: renderBox,
  cup: renderCup,
  bag: renderBag,
  tube: renderTube,
  pump: renderPump,
  jar: renderJar,
  spray: renderSpray,
}

/* ------------------------------------------------------------------ */
/*  buildSvg (main entry)                                              */
/* ------------------------------------------------------------------ */

const buildSvg = (
  width: number,
  height: number,
  name: string,
  brand: string,
  _category: string,
  variant: 'thumb' | 'detail',
  productIndex: number,
): string => {
  const visual = PRODUCT_VISUALS[productIndex] ?? { shape: 'box' as PackagingShape, color: '#607D8B' }
  const id = 'p'
  const cx = width / 2
  const cy = height / 2

  const ctx: ShapeCtx = { w: width, h: height, cx, cy, name, brand, color: visual.color, id, variant }
  const renderer = SHAPE_RENDERERS[visual.shape]
  const shapeContent = renderer(ctx)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${buildDefs(visual.color, id)}
  <rect width="${width}" height="${height}" fill="url(#bgGrad-${id})"/>
  ${shapeContent}
</svg>`
}

const escapeXml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const generateWebp = async (svg: string, width: number, height: number): Promise<Buffer> =>
  sharp(Buffer.from(svg)).resize(width, height).webp({ quality: 85 }).toBuffer()

const PUBLIC_READ_POLICY = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
    },
  ],
})

const ensureBucket = async (): Promise<void> => {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }))
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }))
  }
  await s3.send(new PutBucketPolicyCommand({ Bucket: MINIO_BUCKET, Policy: PUBLIC_READ_POLICY }))
}

const uploadImage = async (key: string, buffer: Buffer): Promise<void> => {
  await s3.send(
    new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
    }),
  )
}

export async function seedProductImages(): Promise<void> {
  await ensureBucket()

  const generate = createImageGenerator()

  // eslint-disable-next-line no-console
  console.log(`Seeding images (${PRODUCT_CATALOG.length} products × 2 variants)`)

  let uploaded = 0
  for (let i = 0; i < PRODUCT_CATALOG.length; i++) {
    const product = PRODUCT_CATALOG[i]!

    // eslint-disable-next-line no-console
    console.log(`[${i + 1}/${PRODUCT_CATALOG.length}] ${product.name}`)

    const thumbBuf = await generate(product, i, 'thumb')
    await uploadImage(product.thumbKey, thumbBuf)

    const detailBuf = await generate(product, i, 'detail')
    await uploadImage(product.detailKey, detailBuf)

    uploaded += 2
  }

  const fallbackSourceProduct = PRODUCT_CATALOG[0]
  if (fallbackSourceProduct) {
    const fallbackThumb = await generate(fallbackSourceProduct, 0, 'thumb')
    await uploadImage(PRODUCT_IMAGE_FALLBACK_THUMB_KEY, fallbackThumb)

    const fallbackDetail = await generate(fallbackSourceProduct, 0, 'detail')
    await uploadImage(PRODUCT_IMAGE_FALLBACK_DETAIL_KEY, fallbackDetail)

    uploaded += 2
  }

  // eslint-disable-next-line no-console
  console.log(`Uploaded ${uploaded} images to ${MINIO_ENDPOINT}/${MINIO_BUCKET}`)
}

seedProductImages()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Seed product images failed', error)
    process.exit(1)
  })
