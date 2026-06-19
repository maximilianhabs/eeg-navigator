import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getWelleById, getArtefaktById,
  resolveArtifactMimics, resolveEegMimics, resolveWellenDDs,
} from '@/lib/data'
import { isWaveEntity } from '@/lib/types'
import type { WaveEntity, ArtifactEntity } from '@/lib/types'
import { StatusBadge, ClassificationBadge, DiseaseValueBadge, Tag } from '@/components/Badge'
import { label } from '@/lib/labels'
import EdfViewer from '@/components/EdfViewer'
import { isAdminAuthenticated } from '@/lib/admin-auth'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const entity = getWelleById(id) ?? getArtefaktById(id)
  return { title: entity?.name ?? id }
}

export default async function EntityDetailPage({ params }: Props) {
  const { id } = await params
  const wave = getWelleById(id)
  const artifact = getArtefaktById(id)
  const entity = wave ?? artifact
  if (!entity) notFound()

  const isWave = isWaveEntity(entity)
  const isAdmin = await isAdminAuthenticated()

  return (
    <div className="max-w-4xl animate-fade-in">

      {/* ── Back + Breadcrumb ── */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:-translate-x-0.5"
          style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
          Atlas
        </Link>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>/</span>
        <span className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{entity.name}</span>
        {isAdmin && (
          <Link href={`/admin/entity/${entity.id}`}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-all hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700"
            style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border)' }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"/>
            </svg>
            Bearbeiten
          </Link>
        )}
      </div>

      {/* ── Mobile Sticky EEG-Kurzinfo ── */}
      {isWave && (
        <div className="md:hidden sticky top-14 z-30 -mx-4 px-4 py-2.5 border-b mb-4 glass"
          style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap gap-1.5">
            <QuickChip icon="〜" label={formatFrequencyShort(entity.frequency)} color="blue" />
            <QuickChip icon="📍" label={entity.localization.slice(0,2).map(label).join(', ')} color="slate" />
            {entity.amplitude.label && (
              <QuickChip icon="↕" label={entity.amplitude.label} color="slate" />
            )}
            <ClassificationChip classification={entity.classification} />
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-mono text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}>
              {entity.id}
            </span>
            <StatusBadge status={entity.data_status} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {entity.name}
          </h1>
          {entity.aliases.length > 0 && (
            <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {entity.aliases.join(' · ')}
            </p>
          )}
        </div>
        {isWave && (
          <div className="flex flex-wrap gap-2">
            <ClassificationBadge classification={entity.classification} />
            <DiseaseValueBadge value={entity.disease_value} />
          </div>
        )}
      </div>

      {/* ── Teaching Pearl ── */}
      {entity.teaching_pearl && (
        <div className="rounded-2xl mb-6 px-5 py-4 border animate-fade-in delay-75"
          style={{ backgroundColor: 'var(--brand-light)', borderColor: 'rgba(37,99,235,0.2)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand)' }}>
            💡 Teaching Pearl
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {entity.teaching_pearl}
          </p>
        </div>
      )}

      {/* ── Warning ── */}
      {entity.warning && (
        <div className="rounded-2xl mb-6 px-5 py-4 border bg-red-50 border-red-100 dark:bg-red-950/30 dark:border-red-900/50">
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1.5">⚠ Warnung</p>
          <p className="text-sm text-red-900 dark:text-red-300 leading-relaxed">{entity.warning}</p>
        </div>
      )}

      <div className="space-y-4">

        {/* ── Signalparameter + Topographie (mobile: gestapelt, desktop: 2-Spalten) ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Section title="Signalparameter">
            <dl className="space-y-2.5 text-sm">
              <Row label="Frequenz"   value={formatFrequency(entity.frequency)} />
              <Row label="Amplitude"  value={formatAmplitude(entity.amplitude)} />
              <Row label="Dauer"      value={formatDuration(entity.duration)} />
              {'polarity' in entity && <Row label="Polarität" value={label(entity.polarity)} />}
              <Row label="Rhythmik"   value={label(entity.rhythmicity)} />
              {'periodicity' in entity && <Row label="Periodizität" value={label(entity.periodicity)} />}
            </dl>
          </Section>

          <Section title="Topographie">
            <dl className="space-y-2.5 text-sm">
              <Row label="Lokalisation" value={entity.localization.map(label).join(', ')} />
              <Row label="Lateralität"  value={label(entity.laterality)} />
              {'field_distribution' in entity && (
                <>
                  <Row label="Feldplausibilität"    value={label(entity.field_distribution.field_plausibility)} />
                  <Row label="Phasenumkehr"          value={label(entity.field_distribution.phase_reversal)} />
                  <Row label="Ref.-Kontaminationsrisiko" value={label(entity.field_distribution.reference_contamination_risk)} />
                </>
              )}
            </dl>
          </Section>
        </div>

        {/* ── Morphologie ── */}
        {entity.morphology && (
          <Section title="Morphologie & Potentialverlauf">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {entity.morphology}
            </p>
            {'potential_course' in entity && entity.potential_course && (
              <p className="mt-3 text-sm leading-relaxed pt-3" style={{
                borderTop: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}>
                {entity.potential_course}
              </p>
            )}
          </Section>
        )}

        {/* ── Montage-Verhalten ── */}
        {'montage_behavior' in entity && entity.montage_behavior && (
          <Section title="Montage-Verhalten">
            <dl className="space-y-3 text-sm">
              <MontageRow label="Bipolar longitudinal" value={entity.montage_behavior.bipolar_longitudinal} />
              <MontageRow label="Bipolar transversal"  value={entity.montage_behavior.bipolar_transverse} />
              <MontageRow label="Referenz Cz"          value={entity.montage_behavior.referential_cz} />
              <MontageRow label="Average Reference"    value={entity.montage_behavior.referential_average} />
              <MontageRow label="Mastoiden-Referenz"   value={entity.montage_behavior.referential_mastoid} />
              {entity.montage_behavior.best_montage && (
                <div className="rounded-xl px-3 py-2.5 mt-1"
                  style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <dt className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">Beste Montage</dt>
                  <dd className="text-sm" style={{ color: 'var(--text-primary)' }}>{entity.montage_behavior.best_montage}</dd>
                </div>
              )}
              {entity.montage_behavior.pitfalls && (
                <div className="rounded-xl px-3 py-2.5"
                  style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <dt className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-0.5">⚠ Pitfalls</dt>
                  <dd className="text-sm" style={{ color: 'var(--text-primary)' }}>{entity.montage_behavior.pitfalls}</dd>
                </div>
              )}
            </dl>
          </Section>
        )}

        {/* ── Klinischer Kontext ── */}
        {isWave && (
          <Section title="Klinischer Kontext">
            <dl className="space-y-2.5 text-sm">
              <Row label="Schlafstadium" value={label(entity.sleep_stage)} />
              <Row label="Altersgruppe"  value={label(entity.age_group)} />
              <Row label="Häufigkeit"    value={label(entity.occurrence_frequency)} />
              <Row label="Kontext"       value={entity.occurrence_context.map(label).join(', ')} />
            </dl>
          </Section>
        )}

        {/* ── Artefakt-spezifisch ── */}
        {!isWave && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="Artefakt-Quelle">
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                {entity.source}
              </p>
              <dl className="space-y-2.5 text-sm">
                <Row label="Klasse"                 value={entity.artifact_class} />
                <Row label="Kortikales Feld plausibel" value={entity.cortical_field_plausible ? 'Ja' : 'Nein'} />
              </dl>
            </Section>
            <Section title="Auslöser & Intervention">
              {(entity.triggering_situation?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <p className="text-xs mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Auslöser</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entity.triggering_situation.map(t => <Tag key={t} label={t} />)}
                  </div>
                </div>
              )}
              {entity.correction_intervention && (Array.isArray(entity.correction_intervention) ? entity.correction_intervention.length > 0 : true) && (
                <div>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Intervention</p>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                    {(Array.isArray(entity.correction_intervention)
                      ? entity.correction_intervention
                      : [entity.correction_intervention]
                    ).map(c => (
                      <li key={c} className="flex gap-1.5">
                        <span style={{ color: 'var(--text-tertiary)' }}>·</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          </div>
        )}

        {/* ── Diagnose-Logik ── */}
        <Section title="Diagnose-Logik">
          <div className="grid gap-4 sm:grid-cols-2">
            {(entity.dialog_logic?.key_features?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  Key Features
                </p>
                <ul className="space-y-1.5">
                  {entity.dialog_logic.key_features.map(f => (
                    <li key={f} className="flex gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(entity.dialog_logic?.criteria_against?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  Dagegen spricht
                </p>
                <ul className="space-y-1.5">
                  {entity.dialog_logic.criteria_against.map(f => (
                    <li key={f} className="flex gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {(entity.dialog_logic?.discriminating_questions?.length ?? 0) > 0 && (
            <div className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Abgrenzungsfragen
              </p>
              <ol className="space-y-1 list-decimal list-inside">
                {entity.dialog_logic.discriminating_questions.map(q => (
                  <li key={q} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{q}</li>
                ))}
              </ol>
            </div>
          )}
        </Section>

        {/* ── Fehlinterpretationen ── */}
        {(entity.common_misinterpretations?.length ?? 0) > 0 && (
          <Section title="Häufige Fehlinterpretationen">
            <ul className="space-y-2">
              {entity.common_misinterpretations.map(m => (
                <li key={m} className="flex gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-amber-400 mt-0.5 shrink-0">!</span> {m}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ── Cross-References ── */}
        <CrossRefs entity={entity} />

        {/* ── EEG-Beispiel (real) ── */}
        {isWave && <EdfViewer entityId={entity.id} />}

        {/* ── Quellen ── */}
        {(entity.source_notes?.length ?? 0) > 0 && (
          <Section title="Quellen">
            <ul className="space-y-1">
              {entity.source_notes.map(s => (
                <li key={s} className="text-xs flex gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  <span>—</span> {s}
                </li>
              ))}
            </ul>
          </Section>
        )}

      </div>
    </div>
  )
}

// ─── Cross-References ─────────────────────────────────────────────────────────

function CrossRefs({ entity }: { entity: WaveEntity | ArtifactEntity }) {
  const hasRefs = isWaveEntity(entity)
    ? (entity.differential_diagnoses.length > 0 || (entity.cross_references.artifact_mimics?.length ?? 0) > 0)
    : ((entity.cross_references.eeg_mimics?.length ?? 0) > 0)

  if (!hasRefs) return null

  return (
    <Section title="Verknüpfungen">
      <div className="space-y-4">
        {isWaveEntity(entity) && entity.differential_diagnoses.length > 0 && (
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Differentialdiagnosen (EEG)</p>
            <RefLinks ids={entity.differential_diagnoses} type="wave" />
          </div>
        )}
        {isWaveEntity(entity) && (entity.cross_references.artifact_mimics?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Artefakt-Mimics</p>
            <RefLinks ids={entity.cross_references.artifact_mimics} type="artifact" />
          </div>
        )}
        {!isWaveEntity(entity) && (entity.cross_references.eeg_mimics?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>EEG-Mimics (imitiert)</p>
            <RefLinks ids={entity.cross_references.eeg_mimics} type="wave" />
          </div>
        )}
      </div>
    </Section>
  )
}

function RefLinks({ ids, type }: { ids: string[]; type: 'wave' | 'artifact' }) {
  const entities = type === 'wave' ? resolveWellenDDs(ids) : resolveArtifactMimics(ids)
  const unresolvedIds = ids.filter(id => !entities.find(e => e.id === id))

  return (
    <div className="flex flex-wrap gap-2">
      {entities.map(e => (
        <Link key={e.id} href={`/entity/${e.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition-all hover:-translate-y-0.5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}>
          <span className="font-mono" style={{ color: 'var(--text-tertiary)' }}>{e.id}</span>
          <span>{e.name}</span>
        </Link>
      ))}
      {unresolvedIds.map(id => (
        <span key={id} className="inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-mono"
          style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>
          {id}
        </span>
      ))}
    </div>
  )
}

// ─── UI-Hilfskomponenten ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
        {title}
      </h2>
      <div className="rounded-2xl border p-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label: lbl, value }: { label: string; value: string }) {
  if (!value || value === 'null') return null
  return (
    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
      <dt className="w-full sm:w-44 sm:shrink-0 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{lbl}</dt>
      <dd className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</dd>
    </div>
  )
}

function MontageRow({ label: lbl, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <dt className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{lbl}</dt>
      <dd className="text-sm" style={{ color: 'var(--text-secondary)' }}>{value}</dd>
    </div>
  )
}

function QuickChip({ icon, label: lbl, color }: { icon: string; label: string; color: 'blue' | 'slate' }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold"
      style={{
        backgroundColor: color === 'blue' ? 'rgba(37,99,235,0.1)' : 'var(--bg-subtle)',
        color: color === 'blue' ? 'var(--brand)' : 'var(--text-secondary)',
        border: '1px solid ' + (color === 'blue' ? 'rgba(37,99,235,0.2)' : 'var(--border)'),
      }}>
      {icon} {lbl}
    </span>
  )
}

function ClassificationChip({ classification }: { classification: WaveEntity['classification'] }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    epileptiform:   { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444' },
    physiologisch:  { bg: 'rgba(16,185,129,0.12)',  text: '#10b981' },
    pathologisch:   { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b' },
    normvariante:   { bg: 'rgba(139,92,246,0.12)',  text: '#8b5cf6' },
    ictal:          { bg: 'rgba(239,68,68,0.15)',   text: '#dc2626' },
  }
  const c = colorMap[classification] ?? { bg: 'var(--bg-subtle)', text: 'var(--text-secondary)' }
  return (
    <span className="inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-bold"
      style={{ backgroundColor: c.bg, color: c.text }}>
      {label(classification)}
    </span>
  )
}

// ─── Formatter ────────────────────────────────────────────────────────────────

function formatFrequencyShort(f: WaveEntity['frequency']): string {
  if (f.min_hz !== null && f.max_hz !== null) return `${f.min_hz}–${f.max_hz} Hz`
  if (f.typical_hz !== null) return `${f.typical_hz} Hz`
  return f.label
}

function formatFrequency(f: WaveEntity['frequency']): string {
  const parts = [f.label]
  if (f.min_hz !== null && f.max_hz !== null) parts.push(`${f.min_hz}–${f.max_hz} Hz`)
  if (f.typical_hz !== null) parts.push(`typisch ${f.typical_hz} Hz`)
  return parts.join(' · ')
}

function formatAmplitude(a: WaveEntity['amplitude']): string {
  const parts = [a.label]
  if (a.min_uv !== null && a.max_uv !== null) parts.push(`${a.min_uv}–${a.max_uv} µV`)
  if (a.typical_uv !== null) parts.push(`typisch ${a.typical_uv} µV`)
  return parts.join(' · ')
}

function formatDuration(d: WaveEntity['duration']): string {
  const parts = [d.label]
  if (d.min_ms !== null && d.max_ms !== null) parts.push(`${d.min_ms}–${d.max_ms} ms`)
  if (d.note) parts.push(d.note)
  return parts.join(' · ')
}
