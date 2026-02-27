import { Hono } from 'hono'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { adminIndex } from '../admin.index'

type DbState = {
  selectQueue: unknown[]
  insertQueue: unknown[]
  updateQueue: unknown[]
  deleteCount: number
}

const { dbState, s3SendMock } = vi.hoisted(() => ({
  dbState: {
    selectQueue: [],
    insertQueue: [],
    updateQueue: [],
    deleteCount: 0,
  } as DbState,
  s3SendMock: vi.fn(async () => ({})),
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

vi.mock('~/lib/s3-client', () => ({
  MINIO_BUCKET: 'product-images',
  publicUrl: vi.fn((key: string) => `http://127.0.0.1:9002/product-images/${key}`),
  s3: {
    send: s3SendMock,
  },
}))

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn(async () => Buffer.from('image-webp')),
  })),
}))

describe('admin product handlers', () => {
  beforeEach(() => {
    dbState.selectQueue = []
    dbState.insertQueue = []
    dbState.updateQueue = []
    dbState.deleteCount = 0
    s3SendMock.mockClear()
  })

  test('creates product with inventory defaults', async () => {
    // given
    const app = new Hono()
    app.route('/admin', adminIndex)
    dbState.selectQueue.push([{ id: 'category-id' }])
    dbState.insertQueue.push([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: '새 상품',
        description: '상품 설명',
        price: 4900,
        status: 'active',
        categoryId: 'category-id',
        thumbUrl: 'http://127.0.0.1:9002/product-images/fallback/product-thumb.webp',
        detailUrl: 'http://127.0.0.1:9002/product-images/fallback/product-detail.webp',
        isSubstitutable: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ])

    // when
    const res = await app.request('http://localhost/admin/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '새 상품',
        description: '상품 설명',
        price: 4900,
        categoryId: '33333333-3333-4333-8333-333333333333',
        isSubstitutable: true,
      }),
    })

    // then
    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      status: 'active',
    })
  })

  test('returns 400 when category does not exist for create', async () => {
    // given
    const app = new Hono()
    app.route('/admin', adminIndex)
    dbState.selectQueue.push([])

    // when
    const res = await app.request('http://localhost/admin/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '새 상품',
        description: '상품 설명',
        price: 4900,
        categoryId: '33333333-3333-4333-8333-333333333333',
      }),
    })

    // then
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'admin_category_not_found',
    })
  })

  test('returns 404 when updating missing product', async () => {
    // given
    const app = new Hono()
    app.route('/admin', adminIndex)
    dbState.selectQueue.push([])

    // when
    const res = await app.request(
      'http://localhost/admin/products/22222222-2222-4222-8222-222222222222',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '수정 상품' }),
      },
    )

    // then
    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toMatchObject({
      code: 'admin_product_not_found',
    })
  })

  test('returns 409 when deleting product with order history', async () => {
    // given
    const app = new Hono()
    app.route('/admin', adminIndex)
    dbState.selectQueue.push([{ id: 'product-id' }], [{ id: 'order-item-id' }])

    // when
    const res = await app.request(
      'http://localhost/admin/products/33333333-3333-4333-8333-333333333333',
      {
        method: 'DELETE',
      },
    )

    // then
    expect(res.status).toBe(409)
    await expect(res.json()).resolves.toMatchObject({
      code: 'admin_product_has_orders',
      error: 'Product has order history',
    })
    expect(dbState.deleteCount).toBe(0)
  })

  test('returns 400 when uploading unsupported image type', async () => {
    // given
    const app = new Hono()
    app.route('/admin', adminIndex)
    dbState.selectQueue.push([{ id: 'product-id' }])
    const formData = new FormData()
    formData.append('file', new File(['text'], 'bad.txt', { type: 'text/plain' }))

    // when
    const res = await app.request(
      'http://localhost/admin/products/44444444-4444-4444-8444-444444444444/images',
      {
        method: 'POST',
        body: formData,
      },
    )

    // then
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'admin_product_image_invalid_type',
    })
  })

  test('uploads product images and updates product urls', async () => {
    // given
    const app = new Hono()
    app.route('/admin', adminIndex)
    dbState.selectQueue.push([{ id: 'product-id' }])
    dbState.updateQueue.push([{ id: 'product-id' }])
    const formData = new FormData()
    formData.append(
      'file',
      new File([new Uint8Array([1, 2, 3, 4])], 'photo.png', { type: 'image/png' }),
    )

    // when
    const res = await app.request(
      'http://localhost/admin/products/55555555-5555-4555-8555-555555555555/images',
      {
        method: 'POST',
        body: formData,
      },
    )

    // then
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      thumbUrl:
        'http://127.0.0.1:9002/product-images/sku-55555555-5555-4555-8555-555555555555-thumb.webp',
      detailUrl:
        'http://127.0.0.1:9002/product-images/sku-55555555-5555-4555-8555-555555555555-detail.webp',
    })
    expect(s3SendMock).toHaveBeenCalledTimes(2)
  })
})
