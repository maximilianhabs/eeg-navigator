#!/usr/bin/env node
// Legt den ersten Admin-User in data/users.json an
// Aufruf: node scripts/setup-admin.mjs
// Läuft auf dem Server BEVOR Docker gestartet wird

import { createHash, randomBytes } from 'crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { createInterface } from 'readline'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dir, '..')
const usersPath = join(projectRoot, 'data', 'users.json')

const rl = createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(r => rl.question(q, r))

async function main() {
  console.log('\n=== EEG Navigator — Admin-Setup ===\n')

  // bcryptjs dynamisch laden (muss im Projekt installiert sein)
  const require = createRequire(import.meta.url)
  let bcrypt
  try {
    bcrypt = require('bcryptjs')
  } catch {
    console.error('Fehler: bcryptjs nicht gefunden. Bitte zuerst: npm install')
    process.exit(1)
  }

  // Prüfen ob bereits User existieren
  if (existsSync(usersPath)) {
    const existing = JSON.parse(readFileSync(usersPath, 'utf-8'))
    if (existing.users?.length > 0) {
      const overwrite = await ask(`⚠ Es existieren bereits ${existing.users.length} User. Fortfahren und neuen Admin hinzufügen? (j/n): `)
      if (overwrite.toLowerCase() !== 'j') {
        console.log('Abgebrochen.')
        rl.close(); process.exit(0)
      }
    }
  }

  const username = await ask('Admin-Benutzername: ')
  if (!username || username.length < 3) {
    console.error('Benutzername muss mindestens 3 Zeichen lang sein.')
    rl.close(); process.exit(1)
  }

  const password = await ask('Admin-Passwort (mind. 12 Zeichen): ')
  if (!password || password.length < 12) {
    console.error('Passwort muss mindestens 12 Zeichen lang sein.')
    rl.close(); process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const id = randomBytes(8).toString('hex')
  const now = new Date().toISOString()

  // Bestehende User laden oder leeres Objekt
  let data = { users: [] }
  if (existsSync(usersPath)) {
    try { data = JSON.parse(readFileSync(usersPath, 'utf-8')) } catch {}
  }

  data.users.push({ id, username, passwordHash, role: 'admin', createdAt: now })

  mkdirSync(join(projectRoot, 'data'), { recursive: true })
  writeFileSync(usersPath, JSON.stringify(data, null, 2), 'utf-8')

  console.log(`\n✓ Admin-User "${username}" angelegt (${usersPath})`)
  console.log('  Starte jetzt Docker: docker compose -f docker-compose.prod.yml up -d --build\n')
  rl.close()
}

main().catch(e => { console.error(e); process.exit(1) })
