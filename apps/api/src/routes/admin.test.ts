import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { adminIndex } from './admin/admin.index'

const { authState } = vi.hoisted(() => ({
  authState: {
    requireAuthResult: 'pass' as 'pass' | 'unauthorized',
    role: 'customer' as 'customer' | 'operator' | 'admin',
    userId: 'user-1',
  },
}))

vi.mock('~/routes/auth/@shared/http/middleware', () => ({
  requireAuth: vi.fn(async (c: { json: Function; set: Function }, next: () => Promise<void>) => {
    if (authState.requireAuthResult === 'unauthorized') {
      return c.json({ code: 'auth_session_expired', error: 'Session expired' }, 401)
    }

    c.set('authUser', {
      id: authState.userId,
      email: 'test@example.com',
      name: 'Test',
      role: authState.role,
      status: 'active',
    })

    return next()
  }),
  requireRole: vi.fn(
    (roles: Array<'customer' | 'operator' | 'admin'>) =>
      async (c: { get: Function; json: Function }, next: () => Promise<void>) => {
        const user = c.get('authUser') as { role: 'customer' | 'operator' | 'admin' } | undefined
        if (!user || !roles.includes(user.role)) {
          return c.json({ code: 'auth_forbidden', error: 'Forbidden' }, 403)
        }

        return next()
      },
  ),
  getAuthUser: vi.fn((c: { get: Function }) => c.get('authUser')),
}))

describe('adminRoute', () => {
  it('returns 403 for customer role on operator endpoint', async () => {
    // given
    authState.requireAuthResult = 'pass'
    authState.role = 'customer'

    const app = createApp()

    // when
    const res = await app.request('http://localhost/admin/dashboard', {
      method: 'GET',
    })

    // then
    expect(res.status).toBe(403)
  })

  it('allows operator on dashboard endpoint', async () => {
    // given
    authState.requireAuthResult = 'pass'
    authState.role = 'operator'

    const app = createApp()

    // when
    const res = await app.request('http://localhost/admin/dashboard', {
      method: 'GET',
    })

    // then
    expect(res.status).toBe(200)
    const body = (await res.json()) as { role: string }
    expect(body.role).toBe('operator')
  })

  it('allows only admin for redrive endpoint', async () => {
    // given
    const app = createApp()

    authState.requireAuthResult = 'pass'
    authState.role = 'operator'

    // when
    let res = await app.request('http://localhost/admin/redrive', {
      method: 'POST',
    })

    // then
    expect(res.status).toBe(403)

    // given
    authState.role = 'admin'

    // when
    res = await app.request('http://localhost/admin/redrive', {
      method: 'POST',
    })

    // then
    expect(res.status).toBe(200)
    const body = (await res.json()) as { action: string }
    expect(body.action).toBe('redrive_started')
  })
})

function createApp(): Hono {
  const app = new Hono()
  app.route('/admin', adminIndex)
  return app
}
