export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
export const REFRESH_TOKEN_TTL_SECONDS = 14 * 24 * 60 * 60

export const ACCESS_COOKIE_NAME = 'qc_access'
export const REFRESH_COOKIE_NAME = 'qc_refresh'
export const AUTH_HINT_COOKIE_NAME = 'qc_auth_hint'

export const isSecureCookie = process.env.NODE_ENV === 'production'
