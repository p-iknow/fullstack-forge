import { describe, expect, it } from 'vitest'
import { SEED_PASSWORD, buildSeedUserCredentialRows } from '~/db/seed-users'
import { verifyPassword } from '~/routes/auth/@shared/security/password'

describe('buildSeedUserCredentialRows', () => {
  it('creates verifiable password hashes for seeded users', async () => {
    // given

    // when
    const rows = await buildSeedUserCredentialRows([
      { id: 'user-1' },
      { id: 'user-2' },
      { id: 'user-3' },
    ])

    // then
    expect(rows).toHaveLength(3)

    for (const row of rows) {
      expect(row.userId).toMatch(/^user-/)
      expect(row.passwordHash.startsWith('scrypt$')).toBe(true)
      await expect(verifyPassword(row.passwordHash, SEED_PASSWORD)).resolves.toBe(true)
    }
  })
})
