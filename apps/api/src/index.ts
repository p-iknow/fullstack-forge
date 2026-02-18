import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

loadEnvFiles()

const { app } = await import('~/app')

export default app

function loadEnvFiles(): void {
  const candidates = ['.env.local', '.env']

  for (const fileName of candidates) {
    const filePath = resolve(process.cwd(), fileName)
    if (!existsSync(filePath)) {
      continue
    }

    const source = readFileSync(filePath, 'utf8')
    for (const line of source.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex <= 0) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex).trim()
      const value = trimmed.slice(separatorIndex + 1).trim()

      if (!key || process.env[key] !== undefined) {
        continue
      }

      process.env[key] = value
    }
  }
}
