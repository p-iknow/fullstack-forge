import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { app } from '../apps/api/src/app'

const OPENAPI_URL = 'http://localhost/openapi.json'
const outputFileUrl = new URL('../packages/api-spec/generated/openapi.yaml', import.meta.url)
const dynamicImport = new Function('moduleName', 'return import(moduleName)') as (
  moduleName: string,
) => Promise<Record<string, unknown>>

const stringifyAsYaml = async (value: unknown): Promise<string> => {
  try {
    const yaml = await dynamicImport('yaml')
    const stringify = yaml.stringify

    if (typeof stringify === 'function') {
      return stringify(value) as string
    }
  } catch {}

  try {
    const jsYaml = await dynamicImport('js-yaml')
    const dump = (jsYaml as { dump?: (input: unknown) => string }).dump

    if (typeof dump === 'function') {
      return dump(value)
    }
  } catch {}

  return `${JSON.stringify(value, null, 2)}\n`
}

const run = async () => {
  const response = await app.fetch(new Request(OPENAPI_URL))

  if (!response.ok) {
    const body = await response.text()
    console.error(`OpenAPI extraction failed: ${response.status} ${response.statusText}`)

    if (body) {
      console.error(body)
    }

    process.exit(1)
  }

  const openApiDocument = await response.json()
  const yaml = await stringifyAsYaml(openApiDocument)
  const outputPath = fileURLToPath(outputFileUrl)

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, yaml, 'utf8')

  console.log(`OpenAPI YAML written to ${outputPath}`)
}

run().catch((error) => {
  console.error('OpenAPI extraction script failed.')
  console.error(error)
  process.exit(1)
})
