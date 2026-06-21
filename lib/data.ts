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
    const cats = [entity.main_category, ...((entity as any).additional_categories ?? [])]
    for (const cat of cats) {
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(entity)
    }
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
    const cats = [entity.subcategory, ...((entity as any).additional_subcategories ?? [])]
    for (const cat of cats) {
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(entity)
    }
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

// ─── Navigation (Breadcrumb + Prev/Next) ─────────────────────────────────────

export function getEntityCategory(id: string): string | null {
  const wave = wellen.find(e => e.id === id)
  if (wave) return wave.main_category
  const art = artefakte.find(e => e.id === id)
  if (art) return art.subcategory
  return null
}

export function getEntityNeighbors(id: string): { prev: string | null; next: string | null } {
  // Wellen: sortiert wie in der DB, gefiltert nach main_category
  const wave = wellen.find(e => e.id === id)
  if (wave) {
    const siblings = wellen.filter(e => e.main_category === wave.main_category)
    const idx = siblings.findIndex(e => e.id === id)
    return {
      prev: idx > 0 ? siblings[idx - 1].id : null,
      next: idx < siblings.length - 1 ? siblings[idx + 1].id : null,
    }
  }
  const art = artefakte.find(e => e.id === id)
  if (art) {
    const siblings = artefakte.filter(e => e.subcategory === art.subcategory)
    const idx = siblings.findIndex(e => e.id === id)
    return {
      prev: idx > 0 ? siblings[idx - 1].id : null,
      next: idx < siblings.length - 1 ? siblings[idx + 1].id : null,
    }
  }
  return { prev: null, next: null }
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
