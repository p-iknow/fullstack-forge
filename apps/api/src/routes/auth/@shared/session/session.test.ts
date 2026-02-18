import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createSession,
  getAuthenticatedSession,
  revokeByRefreshToken,
  revokeSession,
  rotateRefreshToken,
} from '~/routes/auth/@shared/session/session'

type DbState = {
  selectQueue: unknown[]
  insertReturningQueue: unknown[]
  updateWhereArgs: unknown[]
  insertValues: unknown[]
}

type TokenState = {
  opaqueQueue: string[]
  verifyResult: { userId: string; sessionId: string } | null
}

const { dbState, tokenState, tokenMocks } = vi.hoisted(() => {
  const state: DbState = {
    selectQueue: [],
    insertReturningQueue: [],
    updateWhereArgs: [],
    insertValues: [],
  }

  const tokens: TokenState = {
    opaqueQueue: ['refresh-token-1', 'refresh-token-2'],
    verifyResult: null,
  }

  const mocks = {
    createOpaqueToken: vi.fn(() => tokens.opaqueQueue.shift() ?? 'refresh-fallback'),
    hashToken: vi.fn((value: string) => `hash:${value}`),
    signAccessToken: vi.fn((userId: string, sessionId: string) => `jwt:${userId}:${sessionId}`),
    verifyAccessToken: vi.fn(() => tokens.verifyResult),
  }

  return { dbState: state, tokenState: tokens, tokenMocks: mocks }
})

vi.mock('~/routes/auth/@shared/session/tokens', () => tokenMocks)

vi.mock('~/db/client', () => {
  const db = {
    select: vi.fn(() => {
      const builder = {
        from: vi.fn(() => builder),
        where: vi.fn(() => builder),
        limit: vi.fn(async () => (dbState.selectQueue.shift() ?? []) as unknown[]),
      }
      return builder
    }),
    insert: vi.fn(() => ({
      values: vi.fn((values: unknown) => {
        dbState.insertValues.push(values)
        return {
          returning: vi.fn(async () => (dbState.insertReturningQueue.shift() ?? []) as unknown[]),
        }
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async (whereArg: unknown) => {
          dbState.updateWhereArgs.push(whereArg)
          return []
        }),
      })),
    })),
  }

  return { db }
})

describe('session module', () => {
  beforeEach(() => {
    dbState.selectQueue = []
    dbState.insertReturningQueue = []
    dbState.updateWhereArgs = []
    dbState.insertValues = []
    tokenState.opaqueQueue = ['refresh-token-1', 'refresh-token-2']
    tokenState.verifyResult = null

    tokenMocks.createOpaqueToken.mockClear()
    tokenMocks.hashToken.mockClear()
    tokenMocks.signAccessToken.mockClear()
    tokenMocks.verifyAccessToken.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('creates session with hashed refresh token and signed access JWT', async () => {
    // given
    dbState.insertReturningQueue.push([{ id: 'session-1' }])

    // when
    const session = await createSession('user-1')

    // then
    expect(session).toEqual({
      accessToken: 'jwt:user-1:session-1',
      refreshToken: 'refresh-token-1',
      sessionId: 'session-1',
    })
    expect(tokenMocks.hashToken).toHaveBeenCalledWith('refresh-token-1')
    expect(tokenMocks.signAccessToken).toHaveBeenCalledWith('user-1', 'session-1')
    expect(dbState.insertValues).toHaveLength(1)
  })

  it('returns null when access JWT verification fails', async () => {
    // given
    tokenState.verifyResult = null

    // when
    const session = await getAuthenticatedSession('invalid-token')

    // then
    expect(session).toBeNull()
    expect(tokenMocks.verifyAccessToken).toHaveBeenCalledWith('invalid-token')
  })

  it('returns user and session ids when access JWT is valid', async () => {
    // given
    tokenState.verifyResult = { userId: 'user-1', sessionId: 'session-1' }

    // when
    const session = await getAuthenticatedSession('valid-token')

    // then
    expect(session).toEqual({ userId: 'user-1', sessionId: 'session-1' })
  })

  it('marks session revoked on revokeSession', async () => {
    // given

    // when
    await revokeSession('session-1')

    // then
    expect(dbState.updateWhereArgs).toHaveLength(1)
  })

  it('returns null when refresh token does not exist', async () => {
    // given
    dbState.selectQueue.push([])

    // when
    const revokedUserId = await revokeByRefreshToken('refresh-token-x')

    // then
    expect(revokedUserId).toBeNull()
  })

  it('rotates refresh token and issues new access token when session is active', async () => {
    // given
    dbState.selectQueue.push([
      {
        id: 'session-1',
        userId: 'user-1',
        revoked: false,
        expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      },
    ])
    dbState.insertReturningQueue.push([{ id: 'session-2' }])

    // when
    const rotated = await rotateRefreshToken('refresh-token-1')

    // then
    expect(rotated).toEqual({
      kind: 'ok',
      userId: 'user-1',
      accessToken: 'jwt:user-1:session-2',
      refreshToken: 'refresh-token-1',
      sessionId: 'session-2',
    })
    expect(dbState.updateWhereArgs.length).toBeGreaterThanOrEqual(1)
  })
})
