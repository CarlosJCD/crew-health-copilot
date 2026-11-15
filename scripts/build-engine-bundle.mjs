// Builds the ORBIT engine (rules, engine, demo-data checks) as one ES module for the data team's
// human simulator: dist-engine/orbit-engine.mjs. It replaces the simulator's vendor/orbit-engine.mjs,
// so they do not need esbuild or a copy of this repository.
// Usage: node scripts/build-engine-bundle.mjs
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'dist-engine')

await build({
  configFile: false,
  root,
  logLevel: 'warn',
  publicDir: false,
  build: {
    outDir,
    emptyOutDir: true,
    minify: false,
    lib: { entry: resolve(root, 'scripts/engine-entry.ts'), formats: ['es'], fileName: () => 'orbit-engine.mjs' },
  },
})

const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim()
  } catch {
    return 'unknown'
  }
})()
const rules = JSON.parse(readFileSync(resolve(root, 'src/orbit/orbit-indicators.json'), 'utf8'))
const file = resolve(outDir, 'orbit-engine.mjs')
writeFileSync(file, `// ORBIT engine bundle · commit ${commit} · orbit-indicators.json v${rules.version} · built ${new Date().toISOString()}\n` + readFileSync(file, 'utf8'))
console.log(`engine bundle: ${file} (commit ${commit}, rules v${rules.version})`)
