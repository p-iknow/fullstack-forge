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
