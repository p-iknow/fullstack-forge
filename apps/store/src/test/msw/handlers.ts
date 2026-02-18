import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/auth/password-reset/confirm', () => {
    return HttpResponse.json({ ok: true as const }, { status: 200 })
  }),
]
