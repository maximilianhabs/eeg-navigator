import wellenRaw from '@/data/wellen.json'
import artefakteRaw from '@/data/artefakte.json'
import type { WaveEntity, ArtifactEntity } from './types'

// ─── Rohe DB-Daten ────────────────────────────────────────────────────────────

const wellen = wellenRaw.entities as WaveEntity[]
const artefakte = artefakteRaw.artifacts as ArtifactEntity[]

// ─── Wellen ───────────────────────────────────────────────────────────────────

export function getAllWellen(): WaveEntity[] {
  return wellen
}

export function getWelleById(id: string): WaveEntity | undefined {
  return wellen.find(e => e.id === id)
}

export function getWellenByCategory(): Record<string, WaveEntity[]> {
  return wellen.reduce<Record<string, WaveEntity[]>>((acc, entity) => {
    const cat = entity.main_category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(entity)
    return acc
  }, {})
}

export function getWellenCategories(): string[] {
  return [...new Set(wellen.map(e => e.main_category))]
}

// ─── Artefakte ────────────────────────────────────────────────────────────────

export function getAllArtefakte(): ArtifactEntity[] {
  return artefakte
}

export function getArtefaktById(id: string): ArtifactEntity | undefined {
  return artefakte.find(e => e.id === id)
}

export function getArtefakteByCategory(): Record<string, ArtifactEntity[]> {
  return artefakte.reduce<Record<string, ArtifactEntity[]>>((acc, entity) => {
    const cat = entity.subcategory
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(entity)
    return acc
  }, {})
}

// ─── Cross-References auflösen ───────────────────────────────────────────────

export function resolveArtifactMimics(ids: string[]): ArtifactEntity[] {
  return ids.map(id => getArtefaktById(id)).filter(Boolean) as ArtifactEntity[]
}

export function resolveEegMimics(ids: string[]): WaveEntity[] {
  return ids.map(id => getWelleById(id)).filter(Boolean) as WaveEntity[]
}

export function resolveWellenDDs(ids: string[]): WaveEntity[] {
  return ids.map(id => getWelleById(id)).filter(Boolean) as WaveEntity[]
}

// ─── Suche ────────────────────────────────────────────────────────────────────

export function searchAll(query: string): { wellen: WaveEntity[]; artefakte: ArtifactEntity[] } {
  const q = query.toLowerCase().trim()
  if (!q) return { wellen: [], artefakte: [] }

  const matchWelle = (e: WaveEntity) =>
    e.name.toLowerCase().includes(q) ||
    e.aliases.some(a => a.toLowerCase().includes(q)) ||
    e.id.toLowerCase().includes(q)

  const matchArtefakt = (e: ArtifactEntity) =>
    e.name.toLowerCase().includes(q) ||
    e.aliases.some(a => a.toLowerCase().includes(q)) ||
    e.id.toLowerCase().includes(q)

  return {
    wellen: wellen.filter(matchWelle),
    artefakte: artefakte.filter(matchArtefakt),
  }
}
