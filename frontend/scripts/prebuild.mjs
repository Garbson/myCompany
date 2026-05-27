import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))
const versionFile = resolve(root, 'public/version.json')
const releasesDir = resolve(root, '..', 'releases')
const apkSource = resolve(root, 'android/app/build/outputs/apk/debug/app-debug.apk')
const apkName = `myCompany-v${pkg.version}.apk`
const apkDest = resolve(releasesDir, apkName)

if (!existsSync(releasesDir)) mkdirSync(releasesDir, { recursive: true })

// Preserve minVersion from existing file if it's lower (only bump manually for breaking changes)
let minVersion = pkg.version
if (existsSync(versionFile)) {
  const prev = JSON.parse(readFileSync(versionFile, 'utf-8'))
  if (prev.minVersion) {
    minVersion = prev.minVersion
  }
}

const version = {
  version: pkg.version,
  minVersion,
  apkUrl: `https://mycompany.zlabs.com.br/releases/${apkName}`,
  releaseNotes: ''
}

writeFileSync(versionFile, JSON.stringify(version, null, 2) + '\n')
console.log(`version.json updated: ${pkg.version}`)

if (existsSync(apkSource)) {
  copyFileSync(apkSource, apkDest)
  console.log(`${apkName} copied to releases/`)
}
