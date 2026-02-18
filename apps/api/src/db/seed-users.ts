import { hashPassword } from '~/routes/auth/@shared/security/password'

export const SEED_PASSWORD = 'Passw0rd!'

export type SeedUserIdentity = {
  id: string
}

export type SeedCredentialRow = {
  userId: string
  passwordHash: string
}

export async function buildSeedUserCredentialRows(
  users: SeedUserIdentity[],
): Promise<SeedCredentialRow[]> {
  return Promise.all(
    users.map(async (user) => ({
      userId: user.id,
      passwordHash: await hashPassword(SEED_PASSWORD),
    })),
  )
}
