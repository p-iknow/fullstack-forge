import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/components/*.tsx', 'src/hooks/*.ts', 'src/lib/*.ts'],
  dts: true,
  format: 'esm',
  outDir: 'dist',
  clean: true,
})
