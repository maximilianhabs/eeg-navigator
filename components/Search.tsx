'use client'

import { useState, useMemo } from 'react'
import type { WaveEntity, ArtifactEntity } from '@/lib/types'
import { WaveCard } from './EntityCard'
import { ArtifactCard } from './EntityCard'

interface Props {
  wellen: WaveEntity[]
  artefakte: ArtifactEntity[]
}

export function SearchOverlay({ wellen, artefakte }: Props) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return null
    return {
      wellen: wellen.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.aliases.some(a => a.toLowerCase().includes(q)) ||
        e.id.toLowerCase().includes(q) ||
        e.teaching_pearl?.toLowerCase().includes(q)
      ),
      artefakte: artefakte.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.aliases.some(a => a.toLowerCase().includes(q)) ||
        e.id.toLowerCase().includes(q)
      ),
    }
  }, [query, wellen, artefakte])

  const total = results ? results.wellen.length + results.artefakte.length : 0

  return (
    <div className="mb-8">
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
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-xs transition-colors"
            style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Ergebnisse */}
      {results && (
        <div className="mt-5 animate-fade-in">
          {total === 0 ? (
            <div className="py-10 text-center">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Keine Ergebnisse für „{query}"
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {total} Ergebnis{total !== 1 ? 'se' : ''} für „{query}"
              </p>

              {results.wellen.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                    style={{ color: 'var(--text-tertiary)' }}>
                    EEG-Phänomene · {results.wellen.length}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {results.wellen.map(e => <WaveCard key={e.id} entity={e} />)}
                  </div>
                </div>
              )}

              {results.artefakte.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                    style={{ color: 'var(--text-tertiary)' }}>
                    Artefakte · {results.artefakte.length}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {results.artefakte.map(e => <ArtifactCard key={e.id} entity={e} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
