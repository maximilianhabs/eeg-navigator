import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const BACKUP_DIR = path.join(DATA_DIR, 'backups')
const MAX_BACKUPS = 20

export async function POST(request: NextRequest) {
  const { entityId, updates } = await request.json()
  if (!entityId || !updates) {
    return NextResponse.json({ error: 'Missing entityId or updates' }, { status: 400 })
  }

  const isWelle = entityId.startsWith('EEG_')
  const fileName = isWelle ? 'wellen.json' : 'artefakte.json'
  const dataKey = isWelle ? 'entities' : 'artifacts'
  const filePath = path.join(DATA_DIR, fileName)

  const raw = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw)

  const idx: number = data[dataKey].findIndex((e: { id: string }) => e.id === entityId)
  if (idx === -1) {
    return NextResponse.json({ error: `Entity ${entityId} not found` }, { status: 404 })
  }

  // Backup before write
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const backupName = `${isWelle ? 'wellen' : 'artefakte'}_${Date.now()}.json`
  fs.writeFileSync(path.join(BACKUP_DIR, backupName), raw)

  // Trim old backups (keep MAX_BACKUPS per type)
  const prefix = isWelle ? 'wellen_' : 'artefakte_'
  const existingBackups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(prefix))
    .sort()
  for (const old of existingBackups.slice(0, Math.max(0, existingBackups.length - MAX_BACKUPS + 1))) {
    fs.unlinkSync(path.join(BACKUP_DIR, old))
  }

  // Merge and write
  data[dataKey][idx] = deepMerge(data[dataKey][idx], updates)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')

  return NextResponse.json({ ok: true, backup: backupName })
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    const sv = source[key]
    const tv = target[key]
    if (sv !== null && typeof sv === 'object' && !Array.isArray(sv) &&
        tv !== null && typeof tv === 'object' && !Array.isArray(tv)) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>)
    } else {
      result[key] = sv
    }
  }
  return result
}
