import { randomUUID } from 'node:crypto'
import { deleteCookie, setCookie } from 'hono/cookie'
import type { Context } from 'hono'
import {
  ACCESS_COOKIE_NAME,
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_HINT_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
  isSecureCookie,
} from '~/routes/auth/@shared/config/constants'

export const setAuthCookies = (c: Context, accessToken: string, refreshToken: string): void => {
  setCookie(c, ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'Lax',
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  })
  setCookie(c, REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'Lax',
    path: '/',
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  })
  setCookie(c, AUTH_HINT_COOKIE_NAME, String(getAuthHintExpiryEpochSeconds()), {
    httpOnly: false,
    secure: isSecureCookie,
    sameSite: 'Lax',
    path: '/',
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  })
}

export const clearAuthCookies = (c: Context): void => {
  deleteCookie(c, ACCESS_COOKIE_NAME, {
    path: '/',
  })
  deleteCookie(c, REFRESH_COOKIE_NAME, {
    path: '/',
  })
  deleteCookie(c, AUTH_HINT_COOKIE_NAME, {
    path: '/',
  })
}

const getAuthHintExpiryEpochSeconds = (): number =>
  Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_SECONDS

export const getRequestMeta = (
  c: Context,
): {
  ipAddress: string | null
  userAgent: string | null
  requestId: string
} => {
  const forwarded = c.req.header('x-forwarded-for')
  const ipAddress = forwarded?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? null
  const userAgent = c.req.header('user-agent') ?? null
  const requestId = c.req.header('x-request-id') ?? randomUUID()

  return { ipAddress, userAgent, requestId }
}
