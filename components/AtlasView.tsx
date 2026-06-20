'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { WaveEntity, ArtifactEntity } from '@/lib/types'
import { WaveCard, ArtifactCard } from './EntityCard'
import { TopographyView } from './TopographyView'
import { label } from '@/lib/labels'

type ViewMode = 'kacheln' | 'verzeichnis' | 'topographie'
type AgeMode = 'alle' | 'erwachsen' | 'kinder'

const NEONATAL_CATEGORIES = [
  'Neonatale und altersspezifische Muster',
]
const PEDIATRIC_ONLY_AGE_GROUPS = ['neonatal', 'neugeborene', 'fruehgeborene', 'saeuglinge']

// ─── Filter-Definitionen ──────────────────────────────────────────────────────

type FilterId =
  | 'alle'
  | 'physiologisch'
  | 'benigne'
  | 'epileptiform'
  | 'pathologisch'
  | 'kontextabhaengig'
  | 'schlaf'
  | 'artefakte'
  | 'pol_positiv'
  | 'pol_negativ'

interface Filter {
  id: FilterId
  label: string
  color: string
  active: string
}

const FILTERS: Filter[] = [
  { id: 'alle',           label: 'Alle',               color: 'bg-slate-100 text-slate-600 hover:bg-slate-200',              active: 'bg-slate-800 text-white' },
  { id: 'physiologisch',  label: 'Physiologisch',       color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 ring-1 ring-blue-200',   active: 'bg-blue-600 text-white' },
  { id: 'benigne',        label: 'Benigne Variante',    color: 'bg-teal-50 text-teal-700 hover:bg-teal-100 ring-1 ring-teal-200',   active: 'bg-teal-600 text-white' },
  { id: 'epileptiform',   label: 'Epileptiform',        color: 'bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-red-200',       active: 'bg-red-600 text-white' },
  { id: 'pathologisch',   label: 'Pathologisch',        color: 'bg-orange-50 text-orange-700 hover:bg-orange-100 ring-1 ring-orange-200', active: 'bg-orange-600 text-white' },
  { id: 'kontextabhaengig', label: 'Kontextabhängig',  color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 ring-1 ring-purple-200', active: 'bg-purple-600 text-white' },
  { id: 'schlaf',         label: 'Schlafmuster',        color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 ring-1 ring-indigo-200', active: 'bg-indigo-600 text-white' },
  { id: 'artefakte',      label: 'Artefakte',           color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 ring-1 ring-amber-200', active: 'bg-amber-600 text-white' },
  { id: 'pol_positiv',    label: '↓ Primär positiv',   color: 'bg-rose-50 text-rose-700 hover:bg-rose-100 ring-1 ring-rose-200',     active: 'bg-rose-600 text-white' },
  { id: 'pol_negativ',    label: '↑ Primär negativ',   color: 'bg-violet-50 text-violet-700 hover:bg-violet-100 ring-1 ring-violet-200', active: 'bg-violet-600 text-white' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  wellenByCategory: Record<string, WaveEntity[]>
  artefakteByCategory: Record<string, ArtifactEntity[]>
  alleWellen: WaveEntity[]
  alleArtefakte: ArtifactEntity[]
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export function AtlasView({ wellenByCategory, artefakteByCategory, alleWellen, alleArtefakte }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterId>('alle')
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('verzeichnis')
  const [ageMode, setAgeMode] = useState<AgeMode>('alle')

  // ── Suche ──
  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return null
    return {
      wellen: alleWellen.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.aliases.some(a => a.toLowerCase().includes(q)) ||
        e.id.toLowerCase().includes(q) ||
        e.teaching_pearl?.toLowerCase().includes(q)
      ),
      artefakte: alleArtefakte.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.aliases.some(a => a.toLowerCase().includes(q)) ||
        e.id.toLowerCase().includes(q)
      ),
    }
  }, [query, alleWellen, alleArtefakte])

  // ── Altersfilter ──
  const ageFilteredWellen = useMemo(() => {
    if (ageMode === 'alle') return alleWellen
    if (ageMode === 'erwachsen') {
      return alleWellen.filter(e => {
        if (NEONATAL_CATEGORIES.includes(e.main_category)) return false
        const ag = (e.age_group ?? '').toLowerCase()
        if (PEDIATRIC_ONLY_AGE_GROUPS.some(g => ag.includes(g))) return false
        return true
      })
    }
    // kinder: nur pädiatrisch/neonatal relevante
    return alleWellen.filter(e => {
      if (NEONATAL_CATEGORIES.includes(e.main_category)) return true
      const ag = (e.age_group ?? '').toLowerCase()
      return ag.includes('kind') || ag.includes('paed') || ag.includes('jugend') ||
             PEDIATRIC_ONLY_AGE_GROUPS.some(g => ag.includes(g)) ||
             e.pediatric_only === true
    })
  }, [ageMode, alleWellen])

  const ageFilteredByCategory = useMemo(() => {
    if (ageMode === 'alle') return { wellenByCategory, artefakteByCategory }
    const filtered: Record<string, typeof alleWellen> = {}
    const idSet = new Set(ageFilteredWellen.map(e => e.id))
    Object.entries(wellenByCategory).forEach(([cat, entities]) => {
      const f = entities.filter(e => idSet.has(e.id))
      if (f.length > 0) filtered[cat] = f
    })
    return { wellenByCategory: filtered, artefakteByCategory }
  }, [ageMode, ageFilteredWellen, wellenByCategory, artefakteByCategory])

  // ── Klassifikationsfilter ──
  const filteredWellen = useMemo(() => {
    if (activeFilter === 'alle') return null // null = Kategorienansicht
    if (activeFilter === 'artefakte') return []

    return ageFilteredWellen.filter(e => {
      switch (activeFilter) {
        case 'physiologisch':    return e.classification === 'physiologisch'
        case 'benigne':          return e.classification === 'benigne_variante'
        case 'epileptiform':     return e.classification === 'epileptiform'
        case 'pathologisch':     return e.classification === 'pathologisch_nicht_epileptiform' || e.disease_value === 'hochpathologisch' || e.disease_value === 'hoch'
        case 'kontextabhaengig': return e.classification === 'kontextabhaengig'
        case 'pol_positiv':      return e.polarity === 'positiv' || e.polarity === 'positiv_dominant'
        case 'pol_negativ':      return e.polarity === 'negativ' || e.polarity === 'negativ_dominant'
        case 'schlaf':           return e.main_category === 'Schlaf- und Vigilanzmuster'
        default: return true
      }
    })
  }, [activeFilter, ageFilteredWellen])

  const filteredArtefakte = useMemo(() => {
    if (activeFilter === 'alle') return null
    if (activeFilter === 'artefakte') return alleArtefakte
    if (activeFilter === 'schlaf' || activeFilter === 'physiologisch' ||
        activeFilter === 'benigne' || activeFilter === 'epileptiform' ||
        activeFilter === 'pol_positiv' || activeFilter === 'pol_negativ') return []
    return alleArtefakte
  }, [activeFilter, alleArtefakte])

  const isFiltered = activeFilter !== 'alle'
  const isSearching = query.trim().length > 0

  return (
    <div className="space-y-6">

      {/* Suchfeld */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-tertiary)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Name, Alias oder ID suchen…"
          className="w-full rounded-2xl border py-3 pl-10 pr-10 text-sm transition-all duration-200 focus:outline-none"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: query ? 'var(--brand)' : 'var(--border)',
            color: 'var(--text-primary)',
            boxShadow: query ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
          }}
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-xs transition-colors"
            style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}>
            ✕
          </button>
        )}
      </div>

      {/* Altersgruppen-Toggle */}
      {!isSearching && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Altersgruppe:</span>
          <div className="flex items-center rounded-xl border p-0.5"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            {(['alle', 'erwachsen', 'kinder'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setAgeMode(mode)}
                className="rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 min-h-[44px] flex items-center justify-center"
                style={ageMode === mode ? {
                  backgroundColor: mode === 'kinder' ? '#7c3aed' : mode === 'erwachsen' ? '#2563eb' : 'var(--text-primary)',
                  color: '#fff',
                  boxShadow: 'var(--shadow-sm)',
                } : { color: 'var(--text-tertiary)' }}
              >
                {mode === 'alle' ? 'Alle' : mode === 'erwachsen' ? 'Erwachsen' : 'Kinder/Neonatal'}
              </button>
            ))}
          </div>
          {ageMode !== 'alle' && (
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {ageMode === 'erwachsen' ? '· neonatale Muster ausgeblendet' : '· nur pädiatrische Muster'}
            </span>
          )}
        </div>
      )}

      {/* Filter-Chips + View-Toggle */}
      {!isSearching && (
        <div className="space-y-2">
          {/* Filter-Chips */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`rounded-full px-3 py-2 text-xs font-medium transition-all min-h-[44px] flex items-center ${
                  activeFilter === f.id ? f.active : f.color
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* View-Toggle — nur in der Standard-Ansicht (kein Filter aktiv) */}
          {activeFilter === 'alle' && (
            <div className="flex items-center rounded-xl border p-0.5 self-start w-fit"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <button
                onClick={() => setViewMode('verzeichnis')}
                title="Kompaktansicht"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all duration-200 min-h-[44px]"
                style={viewMode === 'verzeichnis'
                  ? { backgroundColor: 'var(--text-primary)', color: 'var(--bg-base)' }
                  : { color: 'var(--text-tertiary)' }}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                  <rect x="1" y="2" width="14" height="2" rx="1"/>
                  <rect x="1" y="7" width="14" height="2" rx="1"/>
                  <rect x="1" y="12" width="14" height="2" rx="1"/>
                </svg>
                Verzeichnis
              </button>
              <button
                onClick={() => setViewMode('kacheln')}
                title="Kachelansicht"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all duration-200 min-h-[44px]"
                style={viewMode === 'kacheln'
                  ? { backgroundColor: 'var(--text-primary)', color: 'var(--bg-base)' }
                  : { color: 'var(--text-tertiary)' }}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                  <rect x="1" y="1" width="6" height="6" rx="1"/>
                  <rect x="9" y="1" width="6" height="6" rx="1"/>
                  <rect x="1" y="9" width="6" height="6" rx="1"/>
                  <rect x="9" y="9" width="6" height="6" rx="1"/>
                </svg>
                Kacheln
              </button>
              {/* Topographie nur auf Desktop */}
              <button
                onClick={() => setViewMode('topographie')}
                title="Topographie"
                className="hidden md:flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200"
                style={viewMode === 'topographie'
                  ? { backgroundColor: 'var(--text-primary)', color: 'var(--bg-base)' }
                  : { color: 'var(--text-tertiary)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
                  <ellipse cx="8" cy="8" rx="6.5" ry="7.5"/>
                  <line x1="8" y1="0.5" x2="8" y2="15.5" strokeDasharray="2 1.5"/>
                  <line x1="1.5" y1="8" x2="14.5" y2="8"/>
                </svg>
                Topographie
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Suchergebnisse ── */}
      {isSearching && searchResults && (
        <SearchResults results={searchResults} query={query} />
      )}

      {/* ── Gefilterte Ansicht ── */}
      {!isSearching && isFiltered && (
        <FilteredResults
          wellen={filteredWellen ?? []}
          artefakte={filteredArtefakte ?? []}
          filterLabel={FILTERS.find(f => f.id === activeFilter)?.label ?? ''}
        />
      )}

      {/* ── Standard-Kategorienansicht ── */}
      {!isSearching && !isFiltered && viewMode === 'kacheln' && (
        <CategoryView
          wellenByCategory={ageFilteredByCategory.wellenByCategory}
          artefakteByCategory={ageFilteredByCategory.artefakteByCategory}
        />
      )}

      {/* ── Verzeichnis-Ansicht ── */}
      {!isSearching && !isFiltered && viewMode === 'verzeichnis' && (
        <DirectoryView
          wellenByCategory={ageFilteredByCategory.wellenByCategory}
          artefakteByCategory={ageFilteredByCategory.artefakteByCategory}
        />
      )}

      {/* ── Topographie-Ansicht ── */}
      {!isSearching && !isFiltered && viewMode === 'topographie' && (
        <TopographyView alleWellen={ageFilteredWellen} />
      )}

    </div>
  )
}

// ─── Kategorie-Farbschema ─────────────────────────────────────────────────────

const CATEGORY_THEME: Record<string, {
  border: string
  bg: string
  label: string
  dot: string
  section?: string   // Oberkategorie für Gruppierung
}> = {
  'Hintergrundaktivität':                          { border: 'border-blue-400',    bg: 'bg-blue-50',    label: 'text-blue-700',   dot: 'bg-blue-400',    section: 'Hintergrundaktivität' },
  'Physiologische Wachmuster':                     { border: 'border-sky-400',     bg: 'bg-sky-50',     label: 'text-sky-700',    dot: 'bg-sky-400',     section: 'Physiologische Wachmuster' },
  'Physiologische Muster und Normalbefunde':       { border: 'border-sky-400',     bg: 'bg-sky-50',     label: 'text-sky-700',    dot: 'bg-sky-400',     section: 'Physiologische Wachmuster' },
  'Reaktivitäts- und Aktivierungsmuster':          { border: 'border-sky-400',     bg: 'bg-sky-50',     label: 'text-sky-700',    dot: 'bg-sky-400',     section: 'Physiologische Wachmuster' },
  'Schlaf- und Vigilanzmuster':                    { border: 'border-indigo-400',  bg: 'bg-indigo-50',  label: 'text-indigo-700', dot: 'bg-indigo-400',  section: 'Schlaf- und Vigilanzmuster' },
  'Benigne Varianten und Normvarianten':           { border: 'border-teal-400',    bg: 'bg-teal-50',    label: 'text-teal-700',   dot: 'bg-teal-400',    section: 'Benigne Varianten' },
  'Benigne Varianten und Spike-Mimics':            { border: 'border-teal-400',    bg: 'bg-teal-50',    label: 'text-teal-700',   dot: 'bg-teal-400',    section: 'Benigne Varianten' },
  'Benigne Varianten':                             { border: 'border-teal-400',    bg: 'bg-teal-50',    label: 'text-teal-700',   dot: 'bg-teal-400',    section: 'Benigne Varianten' },
  'Neonatale und altersspezifische Muster':        { border: 'border-violet-400',  bg: 'bg-violet-50',  label: 'text-violet-700', dot: 'bg-violet-400',  section: 'Neonatale Muster' },
  'Rhythmische und periodische Muster':            { border: 'border-orange-400',  bg: 'bg-orange-50',  label: 'text-orange-700', dot: 'bg-orange-400',  section: 'Pathologische Muster' },
  'Diffuse pathologische Muster und Komamuster':   { border: 'border-orange-500',  bg: 'bg-orange-50',  label: 'text-orange-700', dot: 'bg-orange-500',  section: 'Pathologische Muster' },
  'Pathologische Muster – Fokal und Lateralisiert':{ border: 'border-orange-400',  bg: 'bg-orange-50',  label: 'text-orange-700', dot: 'bg-orange-400',  section: 'Pathologische Muster' },
  'Epileptiforme Potentiale und Muster':           { border: 'border-red-400',     bg: 'bg-red-50',     label: 'text-red-700',    dot: 'bg-red-400',     section: 'Epileptiforme Muster' },
  'Epileptiforme Aktivität – Iktal und Interiktal':{ border: 'border-red-400',     bg: 'bg-red-50',     label: 'text-red-700',    dot: 'bg-red-400',     section: 'Epileptiforme Muster' },
  'Anfallsmuster':                                 { border: 'border-red-500',     bg: 'bg-red-50',     label: 'text-red-800',    dot: 'bg-red-500',     section: 'Epileptiforme Muster' },
  'Schädeldefekt- und Strukturphänomene':          { border: 'border-slate-400',   bg: 'bg-slate-50',   label: 'text-slate-600',  dot: 'bg-slate-400',   section: 'Sonstige' },
}

const SECTION_META: Record<string, { icon: string; color: string; desc: string }> = {
  'Hintergrundaktivität':     { icon: '〜', color: 'text-blue-600',   desc: 'Grundrhythmen und Hintergrundaktivität' },
  'Physiologische Wachmuster':{ icon: '○', color: 'text-sky-600',    desc: 'Normale Wachmuster und Reaktionen' },
  'Schlaf- und Vigilanzmuster':{ icon: '◗', color: 'text-indigo-600', desc: 'Schlafstadien und Vigilanzübergänge' },
  'Benigne Varianten':        { icon: '◇', color: 'text-teal-600',   desc: 'Normvarianten ohne Krankheitswert' },
  'Neonatale Muster':         { icon: '✦', color: 'text-violet-600', desc: 'Altersabhängige Reifungsmuster' },
  'Pathologische Muster':     { icon: '▲', color: 'text-orange-600', desc: 'Nicht-epileptiforme Pathologien' },
  'Epileptiforme Muster':     { icon: '⚡', color: 'text-red-600',    desc: 'Epilepsietypische Potenziale' },
  'Sonstige':                 { icon: '·', color: 'text-slate-500',  desc: '' },
}

function getTheme(category: string) {
  return CATEGORY_THEME[category] ?? {
    border: 'border-slate-300', bg: 'bg-slate-50', label: 'text-slate-600', dot: 'bg-slate-300', section: 'Sonstige'
  }
}

// ─── Kategorienansicht (Standard) ─────────────────────────────────────────────

function CategoryView({
  wellenByCategory,
  artefakteByCategory,
}: {
  wellenByCategory: Record<string, WaveEntity[]>
  artefakteByCategory: Record<string, ArtifactEntity[]>
}) {
  // Wellen nach Oberkategorie gruppieren
  const wellenBySuperSection = Object.entries(wellenByCategory).reduce<
    Record<string, { category: string; entities: WaveEntity[] }[]>
  >((acc, [cat, entities]) => {
    const section = getTheme(cat).section ?? 'Sonstige'
    if (!acc[section]) acc[section] = []
    acc[section].push({ category: cat, entities })
    return acc
  }, {})

  const sectionOrder = [
    'Hintergrundaktivität',
    'Physiologische Wachmuster',
    'Schlaf- und Vigilanzmuster',
    'Benigne Varianten',
    'Neonatale Muster',
    'Pathologische Muster',
    'Epileptiforme Muster',
    'Sonstige',
  ]

  return (
    <div className="space-y-14">
      {/* ── EEG-Wellen nach Oberkategorien ── */}
      {sectionOrder.map(section => {
        const groups = wellenBySuperSection[section]
        if (!groups || groups.length === 0) return null
        const meta = SECTION_META[section] ?? { icon: '·', color: 'text-slate-500', desc: '' }
        const totalInSection = groups.reduce((s, g) => s + g.entities.length, 0)

        return (
          <section key={section}>
            {/* Oberkategorie-Header */}
            <div className="mb-6 flex items-center gap-3">
              <span className={`text-lg ${meta.color}`}>{meta.icon}</span>
              <div>
                <h2 className={`text-sm font-bold tracking-wide ${meta.color}`}>
                  {section}
                  <span className="ml-2 font-normal" style={{ color: 'var(--text-tertiary)' }}>· {totalInSection}</span>
                </h2>
                {meta.desc && <p className="text-xs text-slate-400">{meta.desc}</p>}
              </div>
              <span className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
            </div>

            {/* Unterkategorien */}
            <div className="space-y-8 pl-4">
              {groups.map(({ category, entities }) => {
                const theme = getTheme(category)
                return (
                  <div key={category} className={`border-l-2 ${theme.border} pl-4`}>
                    <div className={`mb-3 flex items-center gap-2`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                      <h3 className={`text-xs font-semibold uppercase tracking-widest ${theme.label}`}>
                        {category}
                        <span className="ml-2 font-normal normal-case tracking-normal text-slate-300">· {entities.length}</span>
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {entities.map(e => <WaveCard key={e.id} entity={e} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* ── Artefakte ── */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <span className="text-lg text-amber-600">⊘</span>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-amber-700">
              Artefakte
              <span className="ml-2 font-normal text-slate-400">· {Object.values(artefakteByCategory).flat().length}</span>
            </h2>
            <p className="text-xs text-slate-400">Physiologische, technische und externe Störmuster</p>
          </div>
          <span className="h-px flex-1 bg-slate-100" />
        </div>
        <div className="space-y-8 pl-4">
          {Object.entries(artefakteByCategory).map(([category, entities]) => (
            <div key={category} className="border-l-2 border-amber-300 pl-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                  {category}
                  <span className="ml-2 font-normal normal-case tracking-normal text-slate-300">· {entities.length}</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {entities.map(e => <ArtifactCard key={e.id} entity={e} />)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Klassifikations-Dot-Farben ───────────────────────────────────────────────

const CLASS_DOT: Record<string, string> = {
  physiologisch:                   'bg-blue-400',
  benigne_variante:                'bg-teal-400',
  kontextabhaengig:                'bg-purple-400',
  pathologisch_nicht_epileptiform: 'bg-orange-400',
  epileptiform:                    'bg-red-500',
}

const CLASS_TEXT: Record<string, string> = {
  physiologisch:                   'text-blue-600',
  benigne_variante:                'text-teal-600',
  kontextabhaengig:                'text-purple-600',
  pathologisch_nicht_epileptiform: 'text-orange-600',
  epileptiform:                    'text-red-600',
}

const CLASS_LABEL: Record<string, string> = {
  physiologisch:                   'Physiol.',
  benigne_variante:                'Benigne',
  kontextabhaengig:                'Kontext',
  pathologisch_nicht_epileptiform: 'Pathol.',
  epileptiform:                    'Epilept.',
}

// ─── Verzeichnis-Ansicht (kompakt) ────────────────────────────────────────────

const COLUMN_LAYOUT: { section: string; col: number }[] = [
  { section: 'Hintergrundaktivität',      col: 0 },
  { section: 'Physiologische Wachmuster', col: 0 },
  { section: 'Schlaf- und Vigilanzmuster',col: 1 },
  { section: 'Benigne Varianten',         col: 1 },
  { section: 'Neonatale Muster',          col: 1 },
  { section: 'Pathologische Muster',      col: 2 },
  { section: 'Epileptiforme Muster',      col: 2 },
  { section: 'Sonstige',                  col: 2 },
  { section: '__artefakte__',             col: 2 },
]

function DirectoryView({
  wellenByCategory,
  artefakteByCategory,
}: {
  wellenByCategory: Record<string, WaveEntity[]>
  artefakteByCategory: Record<string, ArtifactEntity[]>
}) {
  // Wellen nach Oberkategorie gruppieren
  const wellenBySuperSection = Object.entries(wellenByCategory).reduce<
    Record<string, { category: string; entities: WaveEntity[] }[]>
  >((acc, [cat, entities]) => {
    const section = getTheme(cat).section ?? 'Sonstige'
    if (!acc[section]) acc[section] = []
    acc[section].push({ category: cat, entities })
    return acc
  }, {})

  // Artefakte als eigene Pseudo-Sektion
  const artefakteFlat = Object.entries(artefakteByCategory).map(([cat, entities]) => ({ category: cat, entities }))

  // 3 Spalten aufbauen
  const columns: React.ReactNode[][] = [[], [], []]

  for (const { section, col } of COLUMN_LAYOUT) {
    if (section === '__artefakte__') {
      if (artefakteFlat.length === 0) continue
      const allArt = artefakteFlat.flatMap(g => g.entities)
      columns[col].push(
        <DirectorySection
          key="artefakte"
          icon="⊘"
          headerColor="text-amber-700"
          borderColor="border-amber-200"
          bgColor="bg-amber-50"
          title="Artefakte"
          groups={artefakteFlat.map(g => ({
            name: g.category,
            dotColor: 'bg-amber-400',
            labelColor: 'text-amber-700',
            entries: g.entities.map(e => ({
              id: e.id,
              name: e.name,
              tag: null,
              tagColor: '',
              meta: e.aliases[0] ?? '',
            })),
          }))}
          total={allArt.length}
        />
      )
      continue
    }

    const groups = wellenBySuperSection[section]
    if (!groups || groups.length === 0) continue
    const meta = SECTION_META[section] ?? { icon: '·', color: 'text-slate-500', desc: '' }
    const totalInSection = groups.reduce((s, g) => s + g.entities.length, 0)
    const theme0 = getTheme(groups[0].category)

    // Benigne Varianten + Epileptiforme Muster: nach subcategory untergliedern
    const isBenigne = section === 'Benigne Varianten'
    const isEpileptiform = section === 'Epileptiforme Muster'
    let directoryGroups: DirectoryGroup[]

    if (isBenigne) {
      const allEntities = groups.flatMap(g => g.entities)
      const bySubcat = allEntities.reduce<Record<string, WaveEntity[]>>((acc, e) => {
        const sub = e.subcategory ?? 'Sonstige'
        if (!acc[sub]) acc[sub] = []
        acc[sub].push(e)
        return acc
      }, {})
      const subcatOrder = ['Spike-Mimics', 'Langsame Normvarianten']
      const subcats = [
        ...subcatOrder.filter(s => bySubcat[s]),
        ...Object.keys(bySubcat).filter(s => !subcatOrder.includes(s)),
      ]
      // Lateraler-Rectus-Spike (ART_004) als Artefakt-Querverweis in Spike-Mimics
      const rectusEntry: DirectoryEntry = {
        id: 'ART_004',
        name: 'Lateraler-Rectus-Spike',
        tag: 'Artefakt',
        tagColor: 'text-amber-500',
        meta: 'Spike-Mimic (okul.)',
      }
      directoryGroups = subcats.map(sub => {
        const entries: DirectoryEntry[] = (bySubcat[sub] ?? []).map(e => ({
          id: e.id,
          name: e.name,
          tag: CLASS_LABEL[e.classification] ?? null,
          tagColor: CLASS_TEXT[e.classification] ?? 'text-slate-400',
          meta: e.frequency?.typical_hz != null ? `${e.frequency.typical_hz} Hz` : e.frequency?.label ?? '',
        }))
        if (sub === 'Spike-Mimics') entries.push(rectusEntry)
        return { name: sub, dotColor: 'bg-teal-400', labelColor: 'text-teal-700', entries }
      })
    } else if (isEpileptiform) {
      const allEntities = groups.flatMap(g => g.entities)
      // Anfallsmuster nach ihrer Subcategory; alle anderen → "Interiktale Aktivität"
      const IKTAL_SUBCATS = ['Generalisierte Anfallsmuster', 'Fokale Anfallsmuster', 'Status epilepticus']
      const byGroup: Record<string, WaveEntity[]> = { 'Interiktale Aktivität': [] }
      for (const e of allEntities) {
        const sub = e.main_category === 'Anfallsmuster' ? (e.subcategory ?? 'Iktale Muster') : 'Interiktale Aktivität'
        if (!byGroup[sub]) byGroup[sub] = []
        byGroup[sub].push(e)
      }
      const groupOrder = ['Interiktale Aktivität', ...IKTAL_SUBCATS]
      const subcats = [
        ...groupOrder.filter(s => byGroup[s]?.length),
        ...Object.keys(byGroup).filter(s => !groupOrder.includes(s) && byGroup[s]?.length),
      ]
      directoryGroups = subcats.map(sub => ({
        name: sub,
        dotColor: 'bg-red-400',
        labelColor: 'text-red-700',
        entries: (byGroup[sub] ?? []).map(e => ({
          id: e.id,
          name: e.name,
          tag: CLASS_LABEL[e.classification] ?? null,
          tagColor: CLASS_TEXT[e.classification] ?? 'text-slate-400',
          meta: e.frequency?.typical_hz != null ? `${e.frequency.typical_hz} Hz` : e.frequency?.label ?? '',
        })),
      }))
    } else {
      directoryGroups = groups.map(g => {
        const t = getTheme(g.category)
        return {
          name: g.category,
          dotColor: t.dot,
          labelColor: t.label,
          entries: g.entities.map(e => ({
            id: e.id,
            name: e.name,
            tag: CLASS_LABEL[e.classification] ?? null,
            tagColor: CLASS_TEXT[e.classification] ?? 'text-slate-400',
            meta: e.frequency?.typical_hz != null
              ? `${e.frequency.typical_hz} Hz`
              : e.frequency?.label ?? '',
          })),
        }
      })
    }

    columns[col].push(
      <DirectorySection
        key={section}
        icon={meta.icon}
        headerColor={meta.color}
        borderColor={theme0.border.replace('border-', 'border-').replace('-400', '-200').replace('-500', '-200')}
        bgColor={theme0.bg}
        title={section}
        groups={directoryGroups}
        total={totalInSection}
      />
    )
  }

  return (
    <div>
      <p className="mb-4 text-xs text-slate-400">
        Kompaktübersicht · alle {Object.values(wellenByCategory).flat().length} Wellen und {Object.values(artefakteByCategory).flat().length} Artefakte
      </p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {columns.map((col, i) => (
          <div key={i} className="space-y-5">{col}</div>
        ))}
      </div>
    </div>
  )
}

interface DirectoryEntry {
  id: string
  name: string
  tag: string | null
  tagColor: string
  meta: string
}

interface DirectoryGroup {
  name: string
  dotColor: string
  labelColor: string
  entries: DirectoryEntry[]
}

function DirectorySection({
  icon, headerColor, borderColor, bgColor, title, groups, total,
}: {
  icon: string
  headerColor: string
  borderColor: string
  bgColor: string
  title: string
  groups: DirectoryGroup[]
  total: number
}) {
  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} overflow-hidden`}>
      {/* Sektion-Header */}
      <div className="px-3 py-2 border-b border-current border-opacity-10">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm ${headerColor}`}>{icon}</span>
          <span className={`text-xs font-bold tracking-wide ${headerColor}`}>{title}</span>
          <span className="ml-auto text-xs text-slate-400 font-normal">{total}</span>
        </div>
      </div>

      {/* Gruppen + Einträge */}
      <div className="divide-y divide-slate-100">
        {groups.map(group => (
          <div key={group.name}>
            {/* Unterkategorie-Label — nur wenn mehr als eine Gruppe */}
            {groups.length > 1 && (
              <div className="px-3 pt-2 pb-0.5 flex items-center gap-1.5">
                <span className={`inline-block h-1 w-1 rounded-full ${group.dotColor}`} />
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${group.labelColor} opacity-70`}>
                  {group.name}
                </span>
              </div>
            )}
            {/* Einzel-Einträge */}
            {group.entries.map(entry => (
              <Link
                key={entry.id}
                href={`/entity/${entry.id}`}
                className="flex items-baseline gap-2 px-3 py-1 hover:bg-white/60 transition-colors group"
              >
                <span className="text-xs font-medium text-slate-800 group-hover:text-blue-600 transition-colors flex-1 leading-5">
                  {entry.name}
                </span>
                {entry.tag && (
                  <span className={`text-[10px] font-medium shrink-0 ${entry.tagColor}`}>
                    {entry.tag}
                  </span>
                )}
                {entry.meta && (
                  <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                    {entry.meta}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Gefilterte Ansicht ───────────────────────────────────────────────────────

function FilteredResults({
  wellen, artefakte, filterLabel,
}: {
  wellen: WaveEntity[]
  artefakte: ArtifactEntity[]
  filterLabel: string
}) {
  const total = wellen.length + artefakte.length

  if (total === 0) {
    return <p className="text-sm text-slate-400 text-center py-10">Keine Einträge für „{filterLabel}"</p>
  }

  return (
    <div className="space-y-8">
      <p className="text-xs text-slate-400">{total} Eintr{total !== 1 ? 'äge' : 'ag'} · {filterLabel}</p>

      {wellen.length > 0 && (
        <div>
          {artefakte.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              EEG-Phänomene · {wellen.length}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wellen.map(e => <WaveCard key={e.id} entity={e} />)}
          </div>
        </div>
      )}

      {artefakte.length > 0 && (
        <div>
          {wellen.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Artefakte · {artefakte.length}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {artefakte.map(e => <ArtifactCard key={e.id} entity={e} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Suchergebnisse ───────────────────────────────────────────────────────────

function SearchResults({
  results, query,
}: {
  results: { wellen: WaveEntity[]; artefakte: ArtifactEntity[] }
  query: string
}) {
  const total = results.wellen.length + results.artefakte.length

  if (total === 0) {
    return <p className="text-sm text-slate-400 text-center py-10">Keine Ergebnisse für „{query}"</p>
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-400">{total} Ergebnis{total !== 1 ? 'se' : ''} für „{query}"</p>

      {results.wellen.length > 0 && (
        <div>
          {results.artefakte.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              EEG-Phänomene · {results.wellen.length}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.wellen.map(e => <WaveCard key={e.id} entity={e} />)}
          </div>
        </div>
      )}

      {results.artefakte.length > 0 && (
        <div>
          {results.wellen.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Artefakte · {results.artefakte.length}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.artefakte.map(e => <ArtifactCard key={e.id} entity={e} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Hilfselemente ────────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <h2 className="text-base font-semibold text-slate-700 mb-6 flex items-center gap-2">
      <span className="h-px flex-1 bg-slate-200" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </h2>
  )
}

function CategoryGroup({ title, count, children }: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {title}
        <span className="ml-2 font-normal normal-case tracking-normal text-slate-300">· {count}</span>
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  )
}
