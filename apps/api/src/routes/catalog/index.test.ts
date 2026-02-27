import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { catalogIndex } from './index'

type CatalogDbRow = {
  id: string
  name: string
  description: string
  price: number
  status: 'active' | 'low_stock' | 'out_of_stock' | 'discontinued'
  categoryId: string | null
  isSubstitutable: boolean
  createdAt: Date
  onHand: number
  reserved: number
}

type CatalogCategoryRow = {
  id: string
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
}

const { dbRowsState } = vi.hoisted(() => ({
  dbRowsState: {
    productRows: [] as CatalogDbRow[],
    categoryRows: [] as CatalogCategoryRow[],
    selectQueue: [] as unknown[],
  },
}))

vi.mock('~/db/client', () => ({
  db: {
    select: vi.fn(() => {
      const builder = {
        from: vi.fn(() => builder),
        leftJoin: vi.fn(() => builder),
        where: vi.fn(() => builder),
        limit: vi.fn(async () => (dbRowsState.selectQueue.shift() ?? []) as unknown[]),
        orderBy: vi.fn(async () => (dbRowsState.selectQueue.shift() ?? []) as unknown[]),
      }
      return builder
    }),
  },
}))

describe('catalog routes', () => {
  beforeEach(() => {
    dbRowsState.categoryRows = [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        name: '음료',
        slug: 'beverage',
        displayOrder: 2,
        isActive: true,
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        name: '세탁/청소',
        slug: 'laundry-cleaning',
        displayOrder: 4,
        isActive: true,
      },
    ]

    dbRowsState.productRows = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Apple Juice',
        description: 'Fresh juice',
        price: 2900,
        status: 'active',
        categoryId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        isSubstitutable: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        onHand: 8,
        reserved: 2,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Laundry Wipe',
        description: 'House cleaning wipe',
        price: 4900,
        status: 'out_of_stock',
        categoryId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        isSubstitutable: false,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        onHand: 0,
        reserved: 0,
      },
    ]

    dbRowsState.selectQueue = []
  })

  it('returns product list with default pagination', async () => {
    // given
    const app = new Hono()
    app.route('/', catalogIndex)
    dbRowsState.selectQueue.push(dbRowsState.categoryRows, dbRowsState.productRows)

    // when
    const res = await app.request('http://localhost/products')

    // then
    expect(res.status).toBe(200)
    const json = (await res.json()) as {
      total: number
      totalPages: number
      hasPreviousPage: boolean
      hasNextPage: boolean
      items: Array<{ id: string; status: string; canPurchase: boolean }>
    }
    expect(json.total).toBe(2)
    expect(json.totalPages).toBe(1)
    expect(json.hasPreviousPage).toBe(false)
    expect(json.hasNextPage).toBe(false)
    expect(json.items[0]).toMatchObject({
      id: '22222222-2222-2222-2222-222222222222',
      status: 'out_of_stock',
      canPurchase: false,
    })
  })

  it('filters by search query on /products/search', async () => {
    // given
    const app = new Hono()
    app.route('/', catalogIndex)
    dbRowsState.selectQueue.push(dbRowsState.categoryRows, dbRowsState.productRows)

    // when
    const res = await app.request('http://localhost/products/search?q=apple')

    // then
    expect(res.status).toBe(200)
    const json = (await res.json()) as {
      total: number
      totalPages: number
      hasPreviousPage: boolean
      hasNextPage: boolean
      items: Array<{ name: string }>
    }
    expect(json.total).toBe(1)
    expect(json.totalPages).toBe(1)
    expect(json.hasPreviousPage).toBe(false)
    expect(json.hasNextPage).toBe(false)
    expect(json.items[0].name).toBe('Apple Juice')
  })

  it('returns 404 when product does not exist', async () => {
    // given
    const app = new Hono()
    app.route('/', catalogIndex)
    dbRowsState.selectQueue.push(dbRowsState.categoryRows, dbRowsState.productRows)

    // when
    const res = await app.request('http://localhost/products/33333333-3333-4333-8333-333333333333')

    // then
    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toMatchObject({
      code: 'catalog_product_not_found',
    })
  })

  it('returns category list with six categories', async () => {
    // given
    const app = new Hono()
    app.route('/', catalogIndex)
    dbRowsState.selectQueue.push(dbRowsState.categoryRows)

    // when
    const res = await app.request('http://localhost/categories')

    // then
    expect(res.status).toBe(200)
    const json = (await res.json()) as {
      items: unknown[]
    }
    expect(json.items).toHaveLength(2)
  })
})
