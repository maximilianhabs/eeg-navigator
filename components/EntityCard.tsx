import Link from 'next/link'
import type { WaveEntity, ArtifactEntity } from '@/lib/types'
import { StatusBadge, CombinedBadge } from './Badge'
import { label } from '@/lib/labels'
import { EegThumbnail } from './EegThumbnail'

const CLASSIFICATION_ACCENT: Record<string, string> = {
  epileptiform:  '#ef4444',
  physiologisch: '#10b981',
  pathologisch:  '#f59e0b',
  normvariante:  '#8b5cf6',
  ictal:         '#dc2626',
}

export function WaveCard({ entity }: { entity: WaveEntity }) {
  const lokalisierung = entity.localization.map(label).join(', ')
  const accent = CLASSIFICATION_ACCENT[entity.classification] ?? '#64748b'

  return (
    <Link
      href={`/entity/${entity.id}`}
      className="group block rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <EegThumbnail entityId={entity.id} />
      <div className="p-4">
      {/* Accent bar */}
      <div className="flex items-start gap-3">
        <div className="mt-1 w-1 self-stretch rounded-full flex-shrink-0 transition-all duration-200 group-hover:w-1.5"
          style={{ backgroundColor: accent, minHeight: '2rem' }} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="font-mono text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{entity.id}</span>
              <h3 className="mt-0.5 text-sm font-semibold leading-tight transition-colors duration-150 group-hover:text-blue-500"
                style={{ color: 'var(--text-primary)' }}>
                {entity.name}
              </h3>
              {entity.aliases.length > 0 && (
                <p className="mt-0.5 text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {entity.aliases.slice(0, 2).join(' · ')}
                </p>
              )}
            </div>
            <StatusBadge status={entity.data_status} />
          </div>

          {/* Classification + Lokalisation */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <CombinedBadge classification={entity.classification} diseaseValue={entity.disease_value} />
            {lokalisierung && (
              <span className="text-[11px] truncate text-right" style={{ color: 'var(--text-tertiary)' }}>
                {lokalisierung}
              </span>
            )}
          </div>

          {/* Frequenz */}
          <dl className="mt-2 flex gap-4 text-xs">
            <div>
              <dt style={{ color: 'var(--text-tertiary)' }}>Frequenz</dt>
              <dd className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {entity.frequency.label}
                {entity.frequency.typical_hz !== null && (
                  <span className="font-normal ml-1" style={{ color: 'var(--text-tertiary)' }}>
                    · {entity.frequency.typical_hz} Hz
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt style={{ color: 'var(--text-tertiary)' }}>Polarität</dt>
              <dd className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {label(entity.polarity)}
              </dd>
            </div>
          </dl>

          {entity.teaching_pearl && (
            <p className="mt-2.5 text-xs line-clamp-2 italic pt-2"
              style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border)' }}>
              {entity.teaching_pearl}
            </p>
          )}
        </div>
      </div>
      </div>
    </Link>
  )
}

export function ArtifactCard({ entity }: { entity: ArtifactEntity }) {
  const lokalisierung = entity.localization.map(label).join(', ')

  return (
    <Link
      href={`/entity/${entity.id}`}
      className="group block rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <EegThumbnail entityId={entity.id} />
      <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 w-1 self-stretch rounded-full flex-shrink-0 transition-all duration-200 group-hover:w-1.5"
          style={{ backgroundColor: '#f59e0b', minHeight: '2rem' }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="font-mono text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{entity.id}</span>
              <h3 className="mt-0.5 text-sm font-semibold leading-tight transition-colors duration-150 group-hover:text-blue-500"
                style={{ color: 'var(--text-primary)' }}>
                {entity.name}
              </h3>
              {entity.aliases.length > 0 && (
                <p className="mt-0.5 text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {entity.aliases.slice(0, 2).join(' · ')}
                </p>
              )}
            </div>
            <StatusBadge status={entity.data_status} />
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {entity.artifact_class}
            </span>
            {lokalisierung && (
              <span className="text-[11px] truncate text-right" style={{ color: 'var(--text-tertiary)' }}>
                {lokalisierung}
              </span>
            )}
          </div>

          <p className="mt-2 text-xs line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{entity.source}</p>

          {entity.teaching_pearl && (
            <p className="mt-2.5 text-xs line-clamp-2 italic pt-2"
              style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border)' }}>
              {entity.teaching_pearl}
            </p>
          )}
        </div>
      </div>
      </div>
    </Link>
  )
}
