import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getWelleById, getArtefaktById } from '@/lib/data'

export interface EdfMarker { t: number; label: string; color?: string }

function parseFilename(f: string, markerMap?: Record<string, EdfMarker[]>) {
  const parts = f.replace('.edf', '').split('__')
  return {
    filename: f,
    url: `/edf/${f}`,
    slug: parts[0] ?? '',
    age: parts[1] ?? '',
    montage: parts[2] ?? '',
    num: parts[3] ?? '01',
    markers: markerMap?.[f] ?? [],
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

    // Load markers from entity's edf_markers field
    const entity = getWelleById(entityId) ?? getArtefaktById(entityId)
    const markerMap = (entity as any)?.edf_markers as Record<string, EdfMarker[]> | undefined

    return NextResponse.json(all.map(f => parseFilename(f, markerMap)))
  } catch {
    return NextResponse.json([])
  }
}
