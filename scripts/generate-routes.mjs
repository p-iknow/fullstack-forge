import { createRequire } from 'node:module'
import path from 'node:path'

const appDir = process.argv[2]

if (!appDir) {
  console.error('Usage: node scripts/generate-routes.js <app-dir>')
  process.exit(1)
}

const root = path.resolve(appDir)

// Chain: app → @tanstack/react-start → @tanstack/router-plugin → @tanstack/router-generator
const appRequire = createRequire(path.join(root, 'package.json'))
const startPkg = appRequire.resolve('@tanstack/react-start/package.json')
const pluginPkg = createRequire(startPkg).resolve('@tanstack/router-plugin/package.json')
const generatorPath = createRequire(pluginPkg).resolve('@tanstack/router-generator')
const { Generator, getConfig } = await import(generatorPath)

const config = getConfig({}, root)
const generator = new Generator({ config, root })

await generator.run(undefined)
console.log(`route-tree generated: ${appDir}/src/routeTree.gen.ts`)
