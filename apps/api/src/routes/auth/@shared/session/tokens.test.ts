import { afterEach, describe, expect, it, vi } from 'vitest'
import { signAccessToken, verifyAccessToken } from '~/routes/auth/@shared/session/tokens'

const originalEnv = {
  secret: process.env.ACCESS_JWT_SECRET,
  issuer: process.env.ACCESS_JWT_ISSUER,
  audience: process.env.ACCESS_JWT_AUDIENCE,
}

afterEach(() => {
  process.env.ACCESS_JWT_SECRET = originalEnv.secret
  process.env.ACCESS_JWT_ISSUER = originalEnv.issuer
  process.env.ACCESS_JWT_AUDIENCE = originalEnv.audience
  vi.useRealTimers()
})

describe('tokens', () => {
  it('signs and verifies access token with matching claims', () => {
    // given
    process.env.ACCESS_JWT_SECRET = 'test-secret'
    process.env.ACCESS_JWT_ISSUER = 'test-issuer'
    process.env.ACCESS_JWT_AUDIENCE = 'test-audience'

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    // when
    const token = signAccessToken('user-1', 'session-1')
    const verified = verifyAccessToken(token)

    // then
    expect(verified).toEqual({
      userId: 'user-1',
      sessionId: 'session-1',
    })
  })

  it('rejects tampered token signature', () => {
    // given
    process.env.ACCESS_JWT_SECRET = 'test-secret'
    const token = signAccessToken('user-1', 'session-1')
    const [header, payload] = token.split('.')
    const tampered = `${header}.${payload}.invalid-signature`

    // when
    const verified = verifyAccessToken(tampered)

    // then
    expect(verified).toBeNull()
  })

  it('rejects expired token', () => {
    // given
    process.env.ACCESS_JWT_SECRET = 'test-secret'

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    const token = signAccessToken('user-1', 'session-1')

    // when
    vi.setSystemTime(new Date('2026-01-01T00:20:00.000Z'))
    const verified = verifyAccessToken(token)

    // then
    expect(verified).toBeNull()
  })

  it('rejects token when issuer or audience mismatches', () => {
    // given
    process.env.ACCESS_JWT_SECRET = 'test-secret'
    process.env.ACCESS_JWT_ISSUER = 'issuer-a'
    process.env.ACCESS_JWT_AUDIENCE = 'audience-a'

    const token = signAccessToken('user-1', 'session-1')

    process.env.ACCESS_JWT_ISSUER = 'issuer-b'
    process.env.ACCESS_JWT_AUDIENCE = 'audience-b'

    // when
    const verified = verifyAccessToken(token)

    // then
    expect(verified).toBeNull()
  })
})
