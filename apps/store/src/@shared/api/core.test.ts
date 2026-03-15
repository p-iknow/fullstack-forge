import { afterEach, describe, expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { worker } from '~/test/msw'
import { fetchWithRefresh, refreshAccessToken } from '~/@shared/api/core'

describe(fetchWithRefresh.name, () => {
  afterEach(() => {
    worker.resetHandlers()
  })

  test('passes through non-401 responses without refresh attempt', async () => {
    // given
    worker.use(
      http.get('/api/test', () => {
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
    )

    // when
    const response = await fetchWithRefresh('/api/test', { credentials: 'include' })

    // then
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })

  test('retries original request after successful token refresh', async () => {
    // given
    let protectedCallCount = 0
    worker.use(
      http.get('/api/protected', () => {
        protectedCallCount++
        if (protectedCallCount === 1) {
          return HttpResponse.json({ error: 'Session expired' }, { status: 401 })
        }
        return HttpResponse.json({ data: 'secret' }, { status: 200 })
      }),
      http.post('/api/auth/refresh', () => {
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
    )

    // when
    const response = await fetchWithRefresh('/api/protected', { credentials: 'include' })

    // then
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: 'secret' })
    expect(protectedCallCount).toBe(2)
  })

  test('returns original 401 when token refresh fails', async () => {
    // given
    worker.use(
      http.get('/api/protected', () => {
        return HttpResponse.json(
          { code: 'auth_session_expired', error: 'Session expired' },
          { status: 401 },
        )
      }),
    )

    // when
    const response = await fetchWithRefresh('/api/protected', { credentials: 'include' })

    // then
    expect(response.status).toBe(401)
  })
})

describe(refreshAccessToken.name, () => {
  afterEach(() => {
    worker.resetHandlers()
  })

  test('deduplicates concurrent calls into a single refresh request', async () => {
    // given
    let refreshCallCount = 0
    worker.use(
      http.post('/api/auth/refresh', async () => {
        refreshCallCount++
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({ ok: true }, { status: 200 })
      }),
    )

    // when
    const results = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
    ])

    // then
    expect(refreshCallCount).toBe(1)
    expect(results).toEqual([true, true, true])
  })

  test('returns false when refresh endpoint responds with 401', async () => {
    // given — base handler already returns 401

    // when
    const result = await refreshAccessToken()

    // then
    expect(result).toBe(false)
  })
})
