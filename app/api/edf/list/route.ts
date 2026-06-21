import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getWelleById, getArtefaktById } from '@/lib/data'

export async function GET() {
  const dir = path.join(process.cwd(), 'public', 'edf')
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.edf'))
    const entries = files.map(f => {
      const parts = f.replace('.edf', '').split('__')
      const slug = parts[0] ?? ''
      const entity = getWelleById(slug) ?? getArtefaktById(slug)
      return {
        filename: f,
        url: `/edf/${f}`,
        slug,
        entityName: entity?.name ?? null,
        age: parts[1] ?? '',
        montage: parts[2] ?? '',
        num: parts[3] ?? '01',
      }
    })
    return NextResponse.json(entries)
  } catch {
    return NextResponse.json([])
  }
}
