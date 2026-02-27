import { Hono } from 'hono'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { adminIndex } from '../admin.index'

type DbState = {
  selectQueue: unknown[]
  insertQueue: unknown[]
  updateQueue: unknown[]
  deleteCount: number
}

const { dbState } = vi.hoisted(() => ({
  dbState: {
    selectQueue: [],
    insertQueue: [],
    updateQueue: [],
    deleteCount: 0,
  } as DbState,
}))

vi.mock('~/routes/auth/@shared/http/middleware', () => ({
  requireAuth: vi.fn(
    async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
      c.set('authUser', {
        id: 'admin-user',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
        status: 'active',
      })

      return next()
    },
  ),
  getAuthUser: vi.fn((c: { get: (key: string) => unknown }) => c.get('authUser')),
}))

vi.mock('~/db/client', () => ({
  db: {
    select: vi.fn(() => {
      const builder = {
        from: vi.fn(() => builder),
        where: vi.fn(() => builder),
        orderBy: vi.fn(async () => (dbState.selectQueue.shift() ?? []) as unknown[]),
        limit: vi.fn(async () => (dbState.selectQueue.shift() ?? []) as unknown[]),
      }
      return builder
    }),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => (dbState.insertQueue.shift() ?? []) as unknown[]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => (dbState.updateQueue.shift() ?? []) as unknown[]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => {
        dbState.deleteCount += 1
        return []
      }),
    })),
  },
}))

describe('admin category handlers', () => {
  beforeEach(() => {
    dbState.selectQueue = []
    dbState.insertQueue = []
    dbState.updateQueue = []
    dbState.deleteCount = 0
  })

  test('returns category list from database', async () => {
    // given
    const app = new Hono()
    app.route('/admin', adminIndex)
    dbState.selectQueue.push([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: '음료',
        slug: 'beverage',
        displayOrder: 2,
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ])

    // when
    const res = await app.request('http://localhost/admin/categories', {
      method: 'GET',
    })

    // then
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          slug: 'beverage',
        },
      ],
    })
  })

  test('creates category and returns 201', async () => {
    // given
    const app = new Hono()
    app.route('/admin', adminIndex)
    dbState.selectQueue.push([])
    dbState.insertQueue.push([
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: '신규',
        slug: 'new-category',
        displayOrder: 7,
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ])

    // when
    const res = await app.request('http://localhost/admin/categories', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '신규',
        slug: 'new-category',
        displayOrder: 7,
        isActive: true,
      }),
    })

    // then
    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toMatchObject({
      id: '22222222-2222-4222-8222-222222222222',
      slug: 'new-category',
    })
  })

  test('returns 409 when create slug already exists', async () => {
    // given
    const app = new Hono()
    app.route('/admin', adminIndex)
    dbState.selectQueue.push([{ id: 'existing-id' }])

    // when
    const res = await app.request('http://localhost/admin/categories', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '중복',
        slug: 'beverage',
        displayOrder: 2,
        isActive: true,
      }),
    })

    // then
    expect(res.status).toBe(409)
    await expect(res.json()).resolves.toMatchObject({
      code: 'admin_category_slug_conflict',
    })
  })

  test('returns 404 when updating missing category', async () => {
    // given
    const app = new Hono()
    app.route('/admin', adminIndex)
    dbState.selectQueue.push([])

    // when
    const res = await app.request(
      'http://localhost/admin/categories/33333333-3333-4333-8333-333333333333',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '수정' }),
      },
    )

    // then
    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toMatchObject({
      code: 'admin_category_not_found',
    })
  })

  test('returns 409 when deleting category referenced by products', async () => {
    // given
    const app = new Hono()
    app.route('/admin', adminIndex)
    dbState.selectQueue.push([{ id: 'category-id' }], [{ id: 'product-id' }])

    // when
    const res = await app.request(
      'http://localhost/admin/categories/44444444-4444-4444-8444-444444444444',
      {
        method: 'DELETE',
      },
    )

    // then
    expect(res.status).toBe(409)
    await expect(res.json()).resolves.toMatchObject({
      code: 'admin_category_has_products',
    })
    expect(dbState.deleteCount).toBe(0)
  })

  test('deletes category with no product references', async () => {
    // given
    const app = new Hono()
    app.route('/admin', adminIndex)
    dbState.selectQueue.push([{ id: 'category-id' }], [])

    // when
    const res = await app.request(
      'http://localhost/admin/categories/55555555-5555-4555-8555-555555555555',
      {
        method: 'DELETE',
      },
    )

    // then
    expect(res.status).toBe(204)
    expect(dbState.deleteCount).toBe(1)
  })
})
