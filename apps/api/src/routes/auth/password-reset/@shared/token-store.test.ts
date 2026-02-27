import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  consumePasswordResetToken,
  createPasswordResetToken,
} from '~/routes/auth/password-reset/@shared/token-store'

const { redisState, createOpaqueTokenMock, hashTokenMock, setExMock, getMock, delMock } =
  vi.hoisted(() => {
    const state = {
      store: new Map<string, string>(),
    }

    const setEx = vi.fn(async (key: string, _ttl: number, value: string) => {
      state.store.set(key, value)
    })

    const get = vi.fn(async (key: string) => state.store.get(key) ?? null)
    const del = vi.fn(async (key: string) => {
      state.store.delete(key)
    })

    return {
      redisState: state,
      createOpaqueTokenMock: vi.fn(() => 'opaque-reset-token'),
      hashTokenMock: vi.fn((value: string) => `hash:${value}`),
      setExMock: setEx,
      getMock: get,
      delMock: del,
    }
  })

vi.mock('~/cache/client', () => ({
  getRedisClient: vi.fn(async () => ({
    setEx: setExMock,
    get: getMock,
    del: delMock,
  })),
}))

vi.mock('~/routes/auth/@shared/session/tokens', () => ({
  createOpaqueToken: createOpaqueTokenMock,
  hashToken: hashTokenMock,
}))

describe('password reset token store', () => {
  beforeEach(() => {
    redisState.store.clear()
    createOpaqueTokenMock.mockClear()
    hashTokenMock.mockClear()
    setExMock.mockClear()
    getMock.mockClear()
    delMock.mockClear()
  })

  it('creates token and stores hashed key in redis', async () => {
    // given

    // when
    const token = await createPasswordResetToken('user-1')

    // then
    expect(token).toBe('opaque-reset-token')
    expect(setExMock).toHaveBeenCalledWith(
      'auth:password-reset:hash:opaque-reset-token',
      900,
      'user-1',
    )
  })

  it('consumes token once and removes redis key', async () => {
    // given
    await createPasswordResetToken('user-1')

    // when
    const first = await consumePasswordResetToken('opaque-reset-token')
    const second = await consumePasswordResetToken('opaque-reset-token')

    // then
    expect(first).toBe('user-1')
    expect(second).toBeNull()
    expect(delMock).toHaveBeenCalledWith('auth:password-reset:hash:opaque-reset-token')
  })
})
