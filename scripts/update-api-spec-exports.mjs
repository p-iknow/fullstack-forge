import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(scriptDir, '..')
const packageJsonPath = resolve(workspaceRoot, 'packages/api-spec/package.json')
const clientRoot = resolve(workspaceRoot, 'packages/api-spec/generated/client')

const DOMAIN_EXPORT_SUFFIXES = ['client.gen', 'sdk.gen', 'types.gen', '@tanstack/react-query.gen']

const listGeneratedDomains = () => {
  const entries = readdirSync(clientRoot, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted((a, b) => a.localeCompare(b))
}

const isDomainExportKey = (key) => {
  if (!key.startsWith('./client/')) {
    return false
  }

  for (const suffix of DOMAIN_EXPORT_SUFFIXES) {
    if (key.endsWith(`/${suffix}`)) {
      return true
    }
  }

  return false
}

const buildDomainExports = (domain) => ({
  [`./client/${domain}/client.gen`]: {
    types: `./generated/client/${domain}/client.gen.ts`,
    default: `./generated/client/${domain}/client.gen.ts`,
  },
  [`./client/${domain}/sdk.gen`]: {
    types: `./generated/client/${domain}/sdk.gen.ts`,
    default: `./generated/client/${domain}/sdk.gen.ts`,
  },
  [`./client/${domain}/types.gen`]: {
    types: `./generated/client/${domain}/types.gen.ts`,
    default: `./generated/client/${domain}/types.gen.ts`,
  },
  [`./client/${domain}/@tanstack/react-query.gen`]: {
    types: `./generated/client/${domain}/@tanstack/react-query.gen.ts`,
    default: `./generated/client/${domain}/@tanstack/react-query.gen.ts`,
  },
})

const run = () => {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const domains = listGeneratedDomains()

  const exportsEntries = Object.entries(packageJson.exports ?? {})
  const preservedEntries = exportsEntries.filter(([key]) => !isDomainExportKey(key))
  const domainEntries = domains.flatMap((domain) => Object.entries(buildDomainExports(domain)))

  packageJson.exports = Object.fromEntries([...preservedEntries, ...domainEntries])

  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')

  console.log(`Updated api-spec exports for domains: ${domains.join(', ') || 'none'}`)
}

run()
