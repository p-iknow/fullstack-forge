import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(scriptDir, '..')
const OPENAPI_INPUT = resolve(workspaceRoot, 'packages/api-spec/generated/openapi.yaml')
const CLIENT_OUTPUT_ROOT = resolve(workspaceRoot, 'packages/api-spec/generated/client')
const TEMP_ROOT = resolve(workspaceRoot, 'packages/api-spec/generated/.tmp')

const DOMAIN_RULES = [
  { name: 'auth', matcher: (pathKey) => pathKey.startsWith('/auth') },
  { name: 'admin', matcher: (pathKey) => pathKey.startsWith('/admin') },
  { name: 'health', matcher: (pathKey) => pathKey === '/health' },
]

const loadOpenApiDocument = async () => {
  const source = readFileSync(OPENAPI_INPUT, 'utf8')

  try {
    return JSON.parse(source)
  } catch {
    const yamlModule = await import('yaml')
    return yamlModule.parse(source)
  }
}

const runOpenApiTs = (inputPath, outputPath) => {
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'openapi-ts',
      '-i',
      inputPath,
      '-o',
      outputPath,
      '-c',
      '@hey-api/client-ky',
      '-p',
      '@tanstack/react-query',
    ],
    {
      stdio: 'inherit',
      cwd: workspaceRoot,
    },
  )

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const run = async () => {
  const openApiDocument = await loadOpenApiDocument()
  const pathEntries = Object.entries(openApiDocument.paths ?? {})

  rmSync(CLIENT_OUTPUT_ROOT, { recursive: true, force: true })
  rmSync(TEMP_ROOT, { recursive: true, force: true })
  mkdirSync(CLIENT_OUTPUT_ROOT, { recursive: true })
  mkdirSync(TEMP_ROOT, { recursive: true })

  for (const rule of DOMAIN_RULES) {
    const domainPaths = Object.fromEntries(pathEntries.filter(([pathKey]) => rule.matcher(pathKey)))
    if (Object.keys(domainPaths).length === 0) {
      continue
    }

    const domainSpec = {
      ...openApiDocument,
      paths: domainPaths,
    }

    const specPath = resolve(TEMP_ROOT, `openapi-${rule.name}.json`)
    const outputPath = resolve(CLIENT_OUTPUT_ROOT, rule.name)
    writeFileSync(specPath, `${JSON.stringify(domainSpec, null, 2)}\n`, 'utf8')
    runOpenApiTs(specPath, outputPath)
  }

  rmSync(TEMP_ROOT, { recursive: true, force: true })
}

await run()
