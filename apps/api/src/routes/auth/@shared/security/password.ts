import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const PASSWORD_SCHEME = 'scrypt'
const PASSWORD_DIGEST = 'sha256'
const PASSWORD_COST = 16384
const PASSWORD_BLOCK_SIZE = 8
const PASSWORD_PARALLELIZATION = 1
const PASSWORD_KEY_LENGTH = 64
const PASSWORD_SALT_LENGTH = 16

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(PASSWORD_SALT_LENGTH)
  const derived = scryptSync(password, salt, PASSWORD_KEY_LENGTH, {
    N: PASSWORD_COST,
    r: PASSWORD_BLOCK_SIZE,
    p: PASSWORD_PARALLELIZATION,
  })

  return [
    PASSWORD_SCHEME,
    PASSWORD_DIGEST,
    String(PASSWORD_COST),
    String(PASSWORD_BLOCK_SIZE),
    String(PASSWORD_PARALLELIZATION),
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$')
}

export const verifyPassword = async (passwordHash: string, password: string): Promise<boolean> => {
  const parts = passwordHash.split('$')
  if (parts.length !== 7) {
    return false
  }

  const [scheme, digest, costRaw, blockSizeRaw, parallelizationRaw, saltRaw, keyRaw] = parts
  if (scheme !== PASSWORD_SCHEME || digest !== PASSWORD_DIGEST) {
    return false
  }

  const cost = Number(costRaw)
  const blockSize = Number(blockSizeRaw)
  const parallelization = Number(parallelizationRaw)
  if (!Number.isFinite(cost) || !Number.isFinite(blockSize) || !Number.isFinite(parallelization)) {
    return false
  }

  const salt = Buffer.from(saltRaw, 'base64url')
  const expected = Buffer.from(keyRaw, 'base64url')

  const actual = scryptSync(password, salt, expected.length, {
    N: cost,
    r: blockSize,
    p: parallelization,
  })

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}
