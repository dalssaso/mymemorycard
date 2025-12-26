import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'

function loadEnvFromRoot() {
  // Find project root (where .env lives) by walking up from current file
  let dir = import.meta.dir
  while (dir !== '/') {
    const envPath = resolve(dir, '.env')
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIndex = trimmed.indexOf('=')
          if (eqIndex > 0) {
            const key = trimmed.substring(0, eqIndex)
            const value = trimmed.substring(eqIndex + 1)
            // Always set from .env file (override shell env)
            process.env[key] = value
          }
        }
      }
      return
    }
    dir = dirname(dir)
  }
}

loadEnvFromRoot()
