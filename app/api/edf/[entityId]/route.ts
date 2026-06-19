import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function parseFilename(f: string) {
  const parts = f.replace('.edf', '').split('__')
  return {
    filename: f,
    url: `/edf/${f}`,
    slug: parts[0] ?? '',
    age: parts[1] ?? '',
    montage: parts[2] ?? '',
    num: parts[3] ?? '01',
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await params
  const dir = path.join(process.cwd(), 'public', 'edf')

  try {
    const files = fs.readdirSync(dir)

    // Direct matches: files whose slug prefix matches this entity
    const direct = files.filter(f => f.startsWith(entityId + '__') && f.endsWith('.edf'))

    // Alias matches: files listed in aliases.json for this entity
    let aliased: string[] = []
    try {
      const aliasPath = path.join(dir, 'aliases.json')
      const aliases = JSON.parse(fs.readFileSync(aliasPath, 'utf8')) as Record<string, string[]>
      aliased = (aliases[entityId] ?? []).filter(f => files.includes(f))
    } catch { /* no aliases.json or parse error — fine */ }

    // Merge, deduplicate
    const all = [...new Set([...direct, ...aliased])]
    return NextResponse.json(all.map(parseFilename))
  } catch {
    return NextResponse.json([])
  }
}
