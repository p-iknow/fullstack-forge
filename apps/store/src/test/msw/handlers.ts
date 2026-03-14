import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/auth/refresh', () => {
    return HttpResponse.json(
      { code: 'auth_session_expired', error: 'Session expired' },
      { status: 401 },
    )
  }),
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }
    if (body.email === 'blocked@example.com') {
      return HttpResponse.json(
        { code: 'auth_invalid_credentials', error: 'Invalid credentials' },
        { status: 401 },
      )
    }

    return HttpResponse.json(
      {
        user: {
          id: 'user-1',
          email: body.email ?? 'customer@fullstack-forge.local',
          name: 'Customer',
          role: 'customer',
          status: 'active',
        },
      },
      { status: 200 },
    )
  }),
  http.post('/api/auth/signup', async ({ request }) => {
    const body = (await request.json()) as { email?: string; name?: string }
    if (body.email === 'taken@example.com') {
      return HttpResponse.json(
        { code: 'auth_email_conflict', error: 'Email already exists' },
        { status: 409 },
      )
    }

    return HttpResponse.json(
      {
        user: {
          id: 'user-2',
          email: body.email ?? 'new-customer@fullstack-forge.local',
          name: body.name ?? 'New Customer',
          role: 'customer',
          status: 'active',
        },
      },
      { status: 201 },
    )
  }),
  http.get('/api/auth/me', () => {
    return HttpResponse.json(
      { code: 'auth_session_expired', error: 'Session expired' },
      { status: 401 },
    )
  }),
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ ok: true as const }, { status: 200 })
  }),
  http.post('/api/auth/password-reset/confirm', () => {
    return HttpResponse.json({ ok: true as const }, { status: 200 })
  }),
]
