// Usage:
//   node scripts/remove-keycloak.mjs           # dry-run (prints what would change)
//   node scripts/remove-keycloak.mjs --apply   # applies changes
//
// What it does:
// - Scans the repo for Keycloak references (imports, providers, wrappers)
// - Removes next-auth KeycloakProvider usage and @react-keycloak wrappers
// - Removes KEYCLOAK_* envs in .env files
// - Removes Keycloak deps from package.json
// - Optionally deletes files with 'keycloak' in their name (use --apply)
//
// Safe heuristics: only edits common text-based files (.ts, .tsx, .js, .jsx, .mjs, .cjs, .json, .env*, .yml, .yaml, .md, .toml)

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DRY_RUN = !process.argv.includes('--apply')
const ROOT = path.resolve(__dirname, '..')

// Directories to skip during traversal
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.vercel',
  'build',
  'dist',
  'out'
])

// File extensions to inspect
const INSPECT_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json',
  '.env', '.env.local', '.env.development', '.env.production', '.env.test',
  '.yml', '.yaml',
  '.md',
  '.toml'
])

// Dependency names to remove from package.json
const KEYCLOAK_DEPS = [
  'keycloak-js',
  '@react-keycloak/web',
  '@react-keycloak/ssr',
  'keycloak-connect',
  '@keycloak/keycloak-admin-client',
  'next-auth-keycloak-adapter',
]

// Simple logger
function log(...args) {
  console.log('[remove-keycloak]', ...args)
}

async function pathExists(p) {
  try { await fs.access(p); return true } catch { return false }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      files.push(...await walk(full))
    } else {
      files.push(full)
    }
  }
  return files
}

function shouldInspect(filePath) {
  const base = path.basename(filePath)
  if (base.startsWith('.')) {
    // include .env* files
    if (base === '.env' || base.startsWith('.env.')) return true
  }
  const ext = path.extname(filePath)
  if (INSPECT_EXTS.has(ext)) return true
  // include keycloak-named files regardless
  if (base.toLowerCase().includes('keycloak')) return true
  return false
}

// Transformations applied to file content
function transformContent(filePath, content) {
  let changed = false
  const orig = content

  const lowerPath = filePath.toLowerCase()
  const isJSON = filePath.endsWith('.json')
  const isEnv = path.basename(filePath).startsWith('.env')

  // 1) Remove Keycloak imports/requires
  // import ... from 'next-auth/providers/keycloak'
  content = content.replace(
    /^[ \t]*import[^\n]*['"]next-auth\/providers\/keycloak['"];?[ \t]*\r?\n/gm,
    () => { changed = true; return '' }
  )
  // import ... from 'keycloak-js' or '@react-keycloak/...'
  content = content.replace(
    /^[ \t]*import[^\n]*['"][^'"]*keycloak[^'"]*['"];?[ \t]*\r?\n/gmi,
    () => { changed = true; return '' }
  )
  // const x = require('keycloak-js')
  content = content.replace(
    /^[ \t]*(?:const|var|let)[^\n=]*=\s*require$$['"][^'"]*keycloak[^'"]*['"]$$;?[ \t]*\r?\n/gmi,
    () => { changed = true; return '' }
  )

  // 2) Remove ReactKeycloakProvider wrapper tags but keep children
  content = content.replace(
    /<ReactKeycloakProvider\b[^>]*>/g,
    () => { changed = true; return '' }
  )
  content = content.replace(
    /<\/ReactKeycloakProvider>/g,
    () => { changed = true; return '' }
  )

  // 3) Remove KeycloakProvider(...) entries from providers arrays in NextAuth config
  // Matches: KeycloakProvider({ ... }) with optional commas and whitespace
  // Handle trailing or leading commas robustly.
  // Case A: , KeycloakProvider(...) 
  content = content.replace(
    /,\s*KeycloakProvider\s*$$[^)]*$$\s*/gms,
    () => { changed = true; return ',' } // keep comma to maintain list, will clean extra commas below
  )
  // Case B: KeycloakProvider(...),
  content = content.replace(
    /KeycloakProvider\s*$$[^)]*$$\s*,/gms,
    () => { changed = true; return '' }
  )
  // Case C: Only provider or last item
  content = content.replace(
    /KeycloakProvider\s*$$[^)]*$$\s*/gms,
    () => { changed = true; return '' }
  )
  // Clean up potential double-commas in arrays
  content = content.replace(/,\s*,/g, () => { changed = true; return ',' })
  // Clean up [ , item ] => [ item ]
  content = content.replace(/\[\s*,\s*/g, () => { changed = true; return '[' })
  // Clean up [ item , ] => [ item ]
  content = content.replace(/,\s*\]/g, () => { changed = true; return ']' })

  // 4) Remove adapter lines referencing Keycloak adapters
  content = content.replace(
    /adapter\s*:\s*Keycloak[A-Za-z0-9_]*\s*$$[^)]*$$\s*,?/gms,
    () => { changed = true; return '' }
  )

  // 5) Remove KEYCLOAK_* env var lines in .env files
  if (isEnv) {
    content = content.replace(
      /^\s*KEYCLOAK_[A-Z0-9_]+\s*=\s*.*\r?\n/gm,
      () => { changed = true; return '' }
    )
  }

  // 6) If a JSON file that looks like a keycloak config, leave it to deletion step; no content transform.

  // 7) General: remove leftover TypeScript types/imports mentioning Keycloak (catch-all)
  content = content.replace(
    /^[ \t]*import[^\n]*Keycloak[^\n]*\r?\n/gm,
    () => { changed = true; return '' }
  )

  return { changed, content, original: orig }
}

async function processPackageJson() {
  const pkgPath = path.join(ROOT, 'package.json')
  if (!(await pathExists(pkgPath))) return { changed: false, removed: [] }
  const raw = await fs.readFile(pkgPath, 'utf8')
  let json
  try { json = JSON.parse(raw) } catch {
    log('Warning: package.json is not valid JSON, skipping dep removal.')
    return { changed: false, removed: [] }
  }

  const removed = []
  const sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
  let changed = false

  for (const sec of sections) {
    const deps = json[sec]
    if (!deps) continue
    for (const name of Object.keys(deps)) {
      if (name.toLowerCase().includes('keycloak') || KEYCLOAK_DEPS.includes(name)) {
        removed.push({ section: sec, name, version: deps[name] })
        delete deps[name]
        changed = true
      }
    }
  }

  if (changed && !DRY_RUN) {
    await fs.writeFile(pkgPath, JSON.stringify(json, null, 2) + '\n', 'utf8')
  }

  return { changed, removed }
}

async function main() {
  log(DRY_RUN ? 'Dry-run (no changes will be written).' : 'Apply mode (will modify files).')

  const allFiles = await walk(ROOT)
  const targetFiles = allFiles.filter(shouldInspect)

  const toDelete = []
  let fileEdits = 0
  let matchesFound = 0

  for (const file of targetFiles) {
    const base = path.basename(file).toLowerCase()
    const looksLikeKeycloakFile = base.includes('keycloak')
    const ext = path.extname(file)
    const isBinaryLike = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.gz', '.mp3', '.mp4', '.mov'].includes(ext)

    if (isBinaryLike) continue

    let content
    try {
      content = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }

    if (/keycloak/i.test(content) || looksLikeKeycloakFile) {
      matchesFound++
    }

    if (looksLikeKeycloakFile) {
      // Suggest deletion of standalone Keycloak config files
      toDelete.push(file)
    }

    const { changed, content: next } = transformContent(file, content)
    if (changed) {
      fileEdits++
      log(`${DRY_RUN ? '[would edit]' : '[edited]'} ${path.relative(ROOT, file)}`)
      if (!DRY_RUN) {
        await fs.writeFile(file, next, 'utf8')
      }
    }
  }

  // Delete files with 'keycloak' in the name
  const actuallyDeleted = []
  for (const file of toDelete) {
    if (DRY_RUN) {
      log(`[would delete] ${path.relative(ROOT, file)}`)
      continue
    }
    try {
      await fs.unlink(file)
      actuallyDeleted.push(file)
      log('[deleted]', path.relative(ROOT, file))
    } catch (e) {
      // may be directory or protected; ignore
    }
  }

  // Clean package.json deps
  const { changed: pkgChanged, removed } = await processPackageJson()

  log('Summary:')
  log(`  Files scanned: ${targetFiles.length}`)
  log(`  Files with matches: ${matchesFound}`)
  log(`  Files edited: ${fileEdits}`)
  log(`  Files ${DRY_RUN ? 'that would be' : ''} deleted: ${DRY_RUN ? toDelete.length : actuallyDeleted.length}`)
  if (removed.length) {
    log(`  package.json deps removed (${removed.length}):`)
    for (const r of removed) {
      log(`    - ${r.section}: ${r.name}@${r.version}`)
    }
  } else {
    log('  No Keycloak deps found in package.json')
  }

  if (!DRY_RUN) {
    log('Next steps:')
    log('  - Reinstall deps: pnpm install (or npm install / yarn)')
    log('  - Search residue (manual): grep -R "keycloak" -n .')
    log('  - Re-run your app to verify auth still works without Keycloak.')
  } else {
    log('Run with --apply to perform these changes.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
