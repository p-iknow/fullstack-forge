import { Hono } from 'hono'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { cartIndex } from './index'

const authenticated = {
  value: { userId: 'user-1', sessionId: 'session-1' } as { userId: string; sessionId: string } | null,
}

const dbState = {
  selectQueue: [] as unknown[][],
  insertReturning: [] as unknown[],
  updateRowCount: 1,
  deleteRowCount: 1,
}

const dequeueSelectRows = () => (dbState.selectQueue.shift() ?? []) as unknown[]

vi.mock('~/routes/auth/@shared/session/session', async () => {
  const actual = await vi.importActual<object>('~/routes/auth/@shared/session/session')
  return {
    ...actual,
    getAuthenticatedSession: vi.fn(async () => authenticated.value),
  }
})

vi.mock('~/db/client', () => ({
  db: {
    select: vi.fn(() => {
      const builder = {
        from: vi.fn(() => builder),
        where: vi.fn(() => builder),
        limit: vi.fn(async () => dequeueSelectRows()),
        leftJoin: vi.fn(() => builder),
        innerJoin: vi.fn(() => builder),
        then: (resolve: (rows: unknown[]) => unknown) => resolve(dequeueSelectRows()),
      }

      return builder
    }),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => dbState.insertReturning),
        onConflictDoUpdate: vi.fn(() => ({
          returning: vi.fn(async () => dbState.insertReturning),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () =>
            dbState.updateRowCount > 0
              ? [{ id: '11111111-1111-4111-8111-111111111111', version: 2 }]
              : [],
          ),
          then: (resolve: (rows: unknown[]) => unknown) =>
            resolve(dbState.updateRowCount > 0 ? [{ ok: true }] : []),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => (dbState.deleteRowCount > 0 ? [{ ok: true }] : [])),
    })),
  },
}))

const authUserRow = {
  id: 'user-1',
  email: 'demo@example.com',
  name: 'Demo',
  role: 'customer',
  status: 'active',
}

const activeCart = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: 'user-1',
  status: 'active',
  version: 1,
  expiresAt: new Date('2026-01-15T00:00:00.000Z'),
}

const createdCart = {
  ...activeCart,
  createdAt: new Date('2026-01-08T00:00:00.000Z'),
  updatedAt: new Date('2026-01-08T00:00:00.000Z'),
  lastActiveAt: new Date('2026-01-08T00:00:00.000Z'),
}

const emptyCartRow = {
  cartId: activeCart.id,
  cartStatus: 'active',
  cartExpiresAt: activeCart.expiresAt,
  cartVersion: 2,
  cartItemId: null,
  productId: null,
  quantity: null,
  unitPriceSnapshot: null,
  cartItemIsSubstitutable: null,
  cartItemCreatedAt: null,
  cartItemUpdatedAt: null,
  productName: null,
  productSku: null,
  productIsSubstitutable: null,
  productThumbUrl: null,
  onHand: null,
  reserved: null,
  safetyThreshold: null,
}

const oneItemCartRow = {
  cartId: activeCart.id,
  cartStatus: 'active',
  cartExpiresAt: activeCart.expiresAt,
  cartVersion: 2,
  cartItemId: '22222222-2222-4222-8222-222222222222',
  productId: '33333333-3333-4333-8333-333333333333',
  quantity: 2,
  unitPriceSnapshot: 3900,
  cartItemIsSubstitutable: true,
  cartItemCreatedAt: new Date('2026-01-08T00:00:00.000Z'),
  cartItemUpdatedAt: new Date('2026-01-08T00:00:00.000Z'),
  productName: 'Orange Juice',
  productSku: 'SKU-ORANGE-1',
  productIsSubstitutable: true,
  productThumbUrl: 'https://cdn.example.com/thumb.webp',
  onHand: 5,
  reserved: 2,
  safetyThreshold: 4,
}

const pushAuthenticatedUserQuery = () => {
  dbState.selectQueue.push([authUserRow])
}

describe('GET /cart', () => {
  beforeEach(() => {
    authenticated.value = { userId: 'user-1', sessionId: 'session-1' }
    dbState.selectQueue = []
    dbState.insertReturning = []
    dbState.updateRowCount = 1
    dbState.deleteRowCount = 1
  })

  test('returns 200 with empty cart when no active cart exists (auto-creates)', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push([], [emptyCartRow])
    dbState.insertReturning = [createdCart]

    // when
    const res = await app.request('http://localhost/cart', {
      headers: { cookie: 'qc_access=access-token' },
    })

    // then
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      itemCount: 0,
      totalAmount: 0,
      items: [],
    })
  })

  test('returns 200 with existing cart + items', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push([activeCart], [oneItemCartRow])

    // when
    const res = await app.request('http://localhost/cart', {
      headers: { cookie: 'qc_access=access-token' },
    })

    // then
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      itemCount: 2,
      totalAmount: 7800,
      items: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          stockDisplay: 'low_stock',
          availableStock: 3,
        },
      ],
    })
  })
})

describe('POST /cart/items', () => {
  beforeEach(() => {
    authenticated.value = { userId: 'user-1', sessionId: 'session-1' }
    dbState.selectQueue = []
    dbState.insertReturning = []
    dbState.updateRowCount = 1
    dbState.deleteRowCount = 1
  })

  test('adds new item -> 201', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push(
      [activeCart],
      [{ id: '33333333-3333-4333-8333-333333333333', isActive: true, categoryIsActive: true, onHand: 10, reserved: 1 }],
      [],
      [{ count: 0 }],
      [{ id: '33333333-3333-4333-8333-333333333333', price: 3900, isSubstitutable: true }],
      [oneItemCartRow],
    )

    // when
    const res = await app.request('http://localhost/cart/items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'qc_access=access-token',
      },
      body: JSON.stringify({
        productId: '33333333-3333-4333-8333-333333333333',
        quantity: 2,
      }),
    })

    // then
    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toMatchObject({
      itemCount: 2,
      items: [{ productId: '33333333-3333-4333-8333-333333333333' }],
    })
  })

  test('existing product -> upsert quantity sum', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push(
      [activeCart],
      [{ id: '33333333-3333-4333-8333-333333333333', isActive: true, categoryIsActive: true, onHand: 10, reserved: 1 }],
      [{ id: '22222222-2222-4222-8222-222222222222', quantity: 3 }],
      [
        {
          ...oneItemCartRow,
          quantity: 5,
          unitPriceSnapshot: 3900,
        },
      ],
    )

    // when
    const res = await app.request('http://localhost/cart/items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'qc_access=access-token',
      },
      body: JSON.stringify({
        productId: '33333333-3333-4333-8333-333333333333',
        quantity: 2,
      }),
    })

    // then
    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toMatchObject({
      itemCount: 5,
      totalAmount: 19500,
    })
  })

  test('sum > 15 -> 400 quantity_exceeded', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push(
      [activeCart],
      [{ id: '33333333-3333-4333-8333-333333333333', isActive: true, categoryIsActive: true, onHand: 10, reserved: 1 }],
      [{ id: '22222222-2222-4222-8222-222222222222', quantity: 14 }],
    )

    // when
    const res = await app.request('http://localhost/cart/items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'qc_access=access-token',
      },
      body: JSON.stringify({
        productId: '33333333-3333-4333-8333-333333333333',
        quantity: 2,
      }),
    })

    // then
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'quantity_exceeded',
    })
  })

  test('cart has 30 items -> 400 max_items_exceeded', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push(
      [activeCart],
      [{ id: '33333333-3333-4333-8333-333333333333', isActive: true, categoryIsActive: true, onHand: 10, reserved: 1 }],
      [],
      [{ count: 30 }],
    )

    // when
    const res = await app.request('http://localhost/cart/items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'qc_access=access-token',
      },
      body: JSON.stringify({
        productId: '33333333-3333-4333-8333-333333333333',
        quantity: 1,
      }),
    })

    // then
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      code: 'max_items_exceeded',
    })
  })

  test('inactive product -> 422 product_unavailable', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push(
      [activeCart],
      [{ id: '33333333-3333-4333-8333-333333333333', isActive: false, categoryIsActive: true, onHand: 10, reserved: 1 }],
    )

    // when
    const res = await app.request('http://localhost/cart/items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'qc_access=access-token',
      },
      body: JSON.stringify({
        productId: '33333333-3333-4333-8333-333333333333',
        quantity: 1,
      }),
    })

    // then
    expect(res.status).toBe(422)
    await expect(res.json()).resolves.toMatchObject({
      code: 'product_unavailable',
    })
  })
})

describe('PATCH /cart/items/{cartItemId}', () => {
  beforeEach(() => {
    authenticated.value = { userId: 'user-1', sessionId: 'session-1' }
    dbState.selectQueue = []
    dbState.insertReturning = []
    dbState.updateRowCount = 1
    dbState.deleteRowCount = 1
  })

  test('updates quantity -> 200', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push(
      [
        {
          cartItemId: '22222222-2222-4222-8222-222222222222',
          cartId: activeCart.id,
          cartUserId: 'user-1',
          cartStatus: 'active',
          cartVersion: 1,
        },
      ],
      [
        {
          ...oneItemCartRow,
          quantity: 4,
        },
      ],
    )

    // when
    const res = await app.request(
      'http://localhost/cart/items/22222222-2222-4222-8222-222222222222',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          cookie: 'qc_access=access-token',
        },
        body: JSON.stringify({ quantity: 4 }),
      },
    )

    // then
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      itemCount: 4,
    })
  })

  test('quantity > 15 -> 400 quantity_exceeded', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()

    // when
    const res = await app.request(
      'http://localhost/cart/items/22222222-2222-4222-8222-222222222222',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          cookie: 'qc_access=access-token',
        },
        body: JSON.stringify({ quantity: 16 }),
      },
    )

    // then
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      success: false,
    })
  })

  test('unknown item -> 404 item_not_found', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push([])

    // when
    const res = await app.request(
      'http://localhost/cart/items/22222222-2222-4222-8222-222222222222',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          cookie: 'qc_access=access-token',
        },
        body: JSON.stringify({ quantity: 3 }),
      },
    )

    // then
    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toMatchObject({
      code: 'item_not_found',
    })
  })
})

describe('DELETE /cart/items/{cartItemId}', () => {
  beforeEach(() => {
    authenticated.value = { userId: 'user-1', sessionId: 'session-1' }
    dbState.selectQueue = []
    dbState.insertReturning = []
    dbState.updateRowCount = 1
    dbState.deleteRowCount = 1
  })

  test('removes item -> 200', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push(
      [
        {
          cartItemId: '22222222-2222-4222-8222-222222222222',
          cartId: activeCart.id,
          cartUserId: 'user-1',
          cartStatus: 'active',
          cartVersion: 1,
        },
      ],
      [emptyCartRow],
    )

    // when
    const res = await app.request(
      'http://localhost/cart/items/22222222-2222-4222-8222-222222222222',
      {
        method: 'DELETE',
        headers: { cookie: 'qc_access=access-token' },
      },
    )

    // then
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      itemCount: 0,
      items: [],
    })
  })

  test('unknown item -> 404', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push([])

    // when
    const res = await app.request(
      'http://localhost/cart/items/22222222-2222-4222-8222-222222222222',
      {
        method: 'DELETE',
        headers: { cookie: 'qc_access=access-token' },
      },
    )

    // then
    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toMatchObject({
      code: 'item_not_found',
    })
  })
})

describe('DELETE /cart', () => {
  beforeEach(() => {
    authenticated.value = { userId: 'user-1', sessionId: 'session-1' }
    dbState.selectQueue = []
    dbState.insertReturning = []
    dbState.updateRowCount = 1
    dbState.deleteRowCount = 1
  })

  test('clears cart -> 204', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push([
      {
        id: activeCart.id,
        status: 'active',
        version: 1,
      },
    ])

    // when
    const res = await app.request('http://localhost/cart', {
      method: 'DELETE',
      headers: { cookie: 'qc_access=access-token' },
    })

    // then
    expect(res.status).toBe(204)
  })

  test('no active cart -> 204', async () => {
    // given
    const app = new Hono()
    app.route('/cart', cartIndex)
    pushAuthenticatedUserQuery()
    dbState.selectQueue.push([])

    // when
    const res = await app.request('http://localhost/cart', {
      method: 'DELETE',
      headers: { cookie: 'qc_access=access-token' },
    })

    // then
    expect(res.status).toBe(204)
  })
})
