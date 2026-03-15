export type ApiError = {
  code?: string
  error?: string
}

export class ApiClientError extends Error {
  readonly details: ApiError

  constructor(details: ApiError, fallbackMessage = 'Request failed') {
    super(details.error ?? fallbackMessage)
    this.name = 'ApiClientError'
    this.details = details
  }
}

function parseApiErrorPayload(payload: unknown): ApiError | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const objectPayload = payload as Record<string, unknown>
  const code = typeof objectPayload.code === 'string' ? objectPayload.code : undefined
  const error = typeof objectPayload.error === 'string' ? objectPayload.error : undefined

  if (!code && !error) {
    return null
  }

  return { code, error }
}

export async function readApiError(error: unknown): Promise<ApiError> {
  if (error instanceof ApiClientError) {
    return error.details
  }

  const parsedPayload = parseApiErrorPayload(error)
  if (parsedPayload) {
    return parsedPayload
  }

  return {
    error: error instanceof Error ? error.message : 'Request failed',
  }
}

// --- Token refresh interceptor ---

let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    return res.ok
  } catch {
    return false
  }
}

export function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = tryRefreshToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export async function fetchWithRefresh(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init)

  if (response.status !== 401) {
    return response
  }

  const refreshed = await refreshAccessToken()

  if (!refreshed) {
    return response
  }

  return fetch(input, init)
}
