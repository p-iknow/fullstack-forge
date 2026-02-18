import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { ACCESS_TOKEN_TTL_SECONDS } from '~/routes/auth/@shared/config/constants'

type AccessTokenClaims = {
  sub: string
  sid: string
  iat: number
  exp: number
  iss?: string
  aud?: string
}

export const createOpaqueToken = (): string => randomBytes(32).toString('base64url')

export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex')

export const signAccessToken = (userId: string, sessionId: string): string => {
  const issuedAt = Math.floor(Date.now() / 1000)
  const payload: AccessTokenClaims = {
    sub: userId,
    sid: sessionId,
    iat: issuedAt,
    exp: issuedAt + ACCESS_TOKEN_TTL_SECONDS,
  }

  const issuer = process.env.ACCESS_JWT_ISSUER
  if (issuer) {
    payload.iss = issuer
  }

  const audience = process.env.ACCESS_JWT_AUDIENCE
  if (audience) {
    payload.aud = audience
  }

  const headerSegment = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payloadSegment = base64UrlEncode(JSON.stringify(payload))
  const signingInput = `${headerSegment}.${payloadSegment}`
  const signature = base64UrlEncodeBuffer(signJwtInput(signingInput))

  return `${signingInput}.${signature}`
}

export const verifyAccessToken = (token: string): { userId: string; sessionId: string } | null => {
  const segments = token.split('.')
  if (segments.length !== 3) {
    return null
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments
  const headerRaw = base64UrlDecode(headerSegment)
  const payloadRaw = base64UrlDecode(payloadSegment)
  if (!headerRaw || !payloadRaw) {
    return null
  }

  const parsedHeader = parseJsonRecord(headerRaw)
  if (!parsedHeader || parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'JWT') {
    return null
  }

  const claims = parseAccessClaims(payloadRaw)
  if (!claims) {
    return null
  }

  const signingInput = `${headerSegment}.${payloadSegment}`
  const expectedSignature = signJwtInput(signingInput)
  const providedSignature = base64UrlDecodeBuffer(signatureSegment)
  if (!providedSignature) {
    return null
  }

  if (providedSignature.length !== expectedSignature.length) {
    return null
  }

  if (!timingSafeEqual(providedSignature, expectedSignature)) {
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  if (claims.exp <= now) {
    return null
  }

  const issuer = process.env.ACCESS_JWT_ISSUER
  if (issuer && claims.iss !== issuer) {
    return null
  }

  const audience = process.env.ACCESS_JWT_AUDIENCE
  if (audience && claims.aud !== audience) {
    return null
  }

  return {
    userId: claims.sub,
    sessionId: claims.sid,
  }
}

const signJwtInput = (input: string): Buffer =>
  createHmac('sha256', getAccessJwtSecret()).update(input).digest()

const getAccessJwtSecret = (): string =>
  process.env.ACCESS_JWT_SECRET?.trim() || 'dev-only-access-jwt-secret'

const parseAccessClaims = (raw: string): AccessTokenClaims | null => {
  const parsed = parseJsonRecord(raw)
  if (!parsed) {
    return null
  }

  if (
    typeof parsed.sub !== 'string' ||
    typeof parsed.sid !== 'string' ||
    typeof parsed.iat !== 'number' ||
    typeof parsed.exp !== 'number'
  ) {
    return null
  }

  if (parsed.iss !== undefined && typeof parsed.iss !== 'string') {
    return null
  }

  if (parsed.aud !== undefined && typeof parsed.aud !== 'string') {
    return null
  }

  const issuer = typeof parsed.iss === 'string' ? parsed.iss : undefined
  const audience = typeof parsed.aud === 'string' ? parsed.aud : undefined

  return {
    sub: parsed.sub,
    sid: parsed.sid,
    iat: parsed.iat,
    exp: parsed.exp,
    iss: issuer,
    aud: audience,
  }
}

const parseJsonRecord = (raw: string): Record<string, unknown> | null => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null
  }

  return parsed as Record<string, unknown>
}

const base64UrlEncode = (value: string): string => Buffer.from(value, 'utf8').toString('base64url')

const base64UrlEncodeBuffer = (value: Buffer): string => value.toString('base64url')

const base64UrlDecode = (value: string): string | null => {
  try {
    return Buffer.from(value, 'base64url').toString('utf8')
  } catch {
    return null
  }
}

const base64UrlDecodeBuffer = (value: string): Buffer | null => {
  try {
    return Buffer.from(value, 'base64url')
  } catch {
    return null
  }
}
