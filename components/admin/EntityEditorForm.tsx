'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TagInput } from './TagInput'
import type { AnyEntity, WaveEntity, ArtifactEntity } from '@/lib/types'
import { isWaveEntity } from '@/lib/types'

// ─── Enums ────────────────────────────────────────────────────────────────────

const CLASSIFICATION = ['physiologisch','normvariante','kontextabhaengig','epileptiform','pathologisch','artefakt']
const LATERALITY = ['bilateral_symmetrisch','unilateral_links','unilateral_rechts','unilateral_variable','diffus','generalisiert','multifokal']
const POLARITY = ['positiv','negativ','alternierend','variabel','nicht_anwendbar']
const RHYTHMICITY = ['rhythmisch','semi-rhythmisch','arrhythmisch']
const PERIODICITY = ['nicht_periodisch','periodisch','quasi-periodisch']
const DISEASE_VALUE = ['kein','niedrig','mittel','hoch']
const OCCURRENCE_FREQ = ['sehr_haeufig','haeufig','gelegentlich','selten','sehr_selten']
const SLEEP_STAGE = ['nicht_anwendbar','N1','N2','N3','REM','alle','wach']
const AGE_GROUP = ['alle','erwachsen','kinder_jugendliche','neonatal','saeugling','kleinkind','schulkind','jugendliche']
const FREQ_LABELS = ['Delta','Theta','Alpha','Beta','Gamma','Gemischt','Keine','Variable']
const AMP_LABELS = ['niedrig','mittel','hoch','sehr hoch','variabel','nicht_anwendbar']
const FIELD_PLAUS = ['fokal','regional','hemisphärisch','generalisiert','multifokal','nicht_anwendbar']
const PHASE_REVERSAL = ['ja','nein','nicht_anwendbar','variabel']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setPath(obj: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  const result = { ...obj }
  if (path.length === 1) { result[path[0]] = value; return result }
  result[path[0]] = setPath((result[path[0]] ?? {}) as Record<string, unknown>, path.slice(1), value)
  return result
}

function flattenForDiff(obj: unknown, prefix = ''): Record<string, unknown> {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return { [prefix]: obj }
  }
  return Object.entries(obj as Record<string, unknown>).reduce((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    return { ...acc, ...flattenForDiff(v, key) }
  }, {} as Record<string, unknown>)
}

function getDiff(original: AnyEntity, draft: AnyEntity) {
  const orig = flattenForDiff(original)
  const curr = flattenForDiff(draft)
  return Object.entries(curr).filter(([k, v]) => {
    const o = orig[k]
    return JSON.stringify(o) !== JSON.stringify(v)
  }).map(([k, v]) => ({ field: k, oldVal: orig[k], newVal: v }))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  )
}

function TInput({ value, onChange, mono }: { value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <input type="text" value={value ?? ''} onChange={e => onChange(e.target.value)}
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${mono ? 'font-mono' : ''}`}/>
  )
}

function NInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <input type="number" value={value ?? ''} onChange={e => onChange(e.target.value === '' ? null : +e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
  )
}

function TArea({ value, onChange, rows = 3 }: { value: string | null; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={rows}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y"/>
  )
}

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function SectionHeader({ title, icon, open, onToggle }: { title: string; icon: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl">
      <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <span>{icon}</span>{title}
      </span>
      <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
      </svg>
    </button>
  )
}

// ─── Diff Modal ───────────────────────────────────────────────────────────────

function DiffModal({ diffs, onConfirm, onCancel, saving }: {
  diffs: { field: string; oldVal: unknown; newVal: unknown }[]
  onConfirm: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-slate-800 px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Änderungen bestätigen</h2>
          <span className="text-xs text-slate-400">{diffs.length} Feld{diffs.length !== 1 ? 'er' : ''} geändert</span>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {diffs.map(d => (
            <div key={d.field} className="px-5 py-3 space-y-1">
              <p className="text-[10px] font-mono font-bold text-slate-500">{d.field}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded bg-red-50 border border-red-100 px-2 py-1">
                  <p className="text-[9px] font-bold text-red-500 mb-0.5">VORHER</p>
                  <p className="text-xs text-red-700 break-all">{JSON.stringify(d.oldVal)}</p>
                </div>
                <div className="rounded bg-green-50 border border-green-100 px-2 py-1">
                  <p className="text-[9px] font-bold text-green-600 mb-0.5">NACHHER</p>
                  <p className="text-xs text-green-700 break-all">{JSON.stringify(d.newVal)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 flex gap-3 border-t border-slate-100">
          <button onClick={onCancel} disabled={saving}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
            Abbrechen
          </button>
          <button onClick={onConfirm} disabled={saving}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? 'Speichert…' : '✓ Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function EntityEditorForm({ entity }: { entity: AnyEntity }) {
  const router = useRouter()
  const [draft, setDraft] = useState<AnyEntity>(() => JSON.parse(JSON.stringify(entity)))
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ basis: true })
  const [showDiff, setShowDiff] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const isWave = isWaveEntity(draft)
  const wave = isWave ? draft as WaveEntity : null
  const art = isWave ? null : draft as ArtifactEntity

  function upd(path: string[], value: unknown) {
    setDraft(prev => setPath(prev as unknown as Record<string, unknown>, path, value) as unknown as AnyEntity)
  }

  function toggleSection(id: string) {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const diffs = getDiff(entity, draft)
  const hasChanges = diffs.length > 0

  async function doSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: entity.id, updates: draft }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setShowDiff(false)
      setToast({ msg: '✓ Gespeichert — Backup erstellt', type: 'ok' })
      setTimeout(() => { setToast(null); router.refresh() }, 2000)
    } catch (e) {
      setToast({ msg: `Fehler: ${(e as Error).message}`, type: 'err' })
    } finally {
      setSaving(false)
    }
  }

  const open = openSections

  return (
    <div className="space-y-3 pb-32">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
          toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Diff Modal */}
      {showDiff && (
        <DiffModal diffs={diffs} onConfirm={doSave} onCancel={() => setShowDiff(false)} saving={saving}/>
      )}

      {/* ── Basis ── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <SectionHeader title="Basis" icon="📋" open={!!open.basis} onToggle={() => toggleSection('basis')}/>
        {open.basis && (
          <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name">
              <TInput value={draft.name} onChange={v => upd(['name'], v)}/>
            </Field>
            <Field label="data_status" hint="Nur partial → complete erlaubt">
              <select value={draft.data_status}
                onChange={e => {
                  if (entity.data_status === 'complete' && e.target.value !== 'complete') return
                  upd(['data_status'], e.target.value)
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                {['skeleton','partial','complete','verified'].map(s => (
                  <option key={s} value={s}
                    disabled={entity.data_status === 'complete' && s !== 'complete'}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Aliases">
                <TagInput values={draft.aliases} onChange={v => upd(['aliases'], v)}/>
              </Field>
            </div>
            {wave && (
              <Field label="Klassifikation">
                <Select value={wave.classification} options={CLASSIFICATION} onChange={v => upd(['classification'], v)}/>
              </Field>
            )}
            <div className="sm:col-span-2">
              <Field label="Teaching Pearl">
                <TArea value={draft.teaching_pearl} onChange={v => upd(['teaching_pearl'], v)} rows={3}/>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Warnung (leer lassen falls keine)">
                <TArea value={draft.warning} onChange={v => upd(['warning'], v || null)} rows={2}/>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Notizen">
                <TArea value={draft.notes} onChange={v => upd(['notes'], v)} rows={2}/>
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* ── Signal ── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <SectionHeader title="Signal" icon="〜" open={!!open.signal} onToggle={() => toggleSection('signal')}/>
        {open.signal && (
          <div className="px-4 py-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Frequenz-Label">
                <Select value={draft.frequency.label} options={FREQ_LABELS} onChange={v => upd(['frequency','label'], v)}/>
              </Field>
              <Field label="Min Hz">
                <NInput value={draft.frequency.min_hz} onChange={v => upd(['frequency','min_hz'], v)}/>
              </Field>
              <Field label="Max Hz">
                <NInput value={draft.frequency.max_hz} onChange={v => upd(['frequency','max_hz'], v)}/>
              </Field>
              <Field label="Typisch Hz">
                <NInput value={draft.frequency.typical_hz} onChange={v => upd(['frequency','typical_hz'], v)}/>
              </Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Amplitude-Label">
                <Select value={draft.amplitude.label} options={AMP_LABELS} onChange={v => upd(['amplitude','label'], v)}/>
              </Field>
              <Field label="Min µV">
                <NInput value={draft.amplitude.min_uv} onChange={v => upd(['amplitude','min_uv'], v)}/>
              </Field>
              <Field label="Max µV">
                <NInput value={draft.amplitude.max_uv} onChange={v => upd(['amplitude','max_uv'], v)}/>
              </Field>
              <Field label="Typisch µV">
                <NInput value={draft.amplitude.typical_uv} onChange={v => upd(['amplitude','typical_uv'], v)}/>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {wave && (
                <Field label="Polarität">
                  <Select value={wave.polarity} options={POLARITY} onChange={v => upd(['polarity'], v)}/>
                </Field>
              )}
              <Field label="Rhythmizität">
                <Select value={draft.rhythmicity} options={RHYTHMICITY} onChange={v => upd(['rhythmicity'], v)}/>
              </Field>
              {wave && (
                <Field label="Periodizität">
                  <Select value={wave.periodicity} options={PERIODICITY} onChange={v => upd(['periodicity'], v)}/>
                </Field>
              )}
            </div>
            <Field label="Morphologie">
              <TArea value={draft.morphology} onChange={v => upd(['morphology'], v)} rows={2}/>
            </Field>
            {wave && (
              <Field label="Potential-Verlauf">
                <TArea value={wave.potential_course} onChange={v => upd(['potential_course'], v)} rows={2}/>
              </Field>
            )}
          </div>
        )}
      </div>

      {/* ── Topographie ── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <SectionHeader title="Topographie" icon="📍" open={!!open.topo} onToggle={() => toggleSection('topo')}/>
        {open.topo && (
          <div className="px-4 py-4 space-y-4">
            <Field label="Lokalisation">
              <TagInput values={draft.localization} onChange={v => upd(['localization'], v)} placeholder="z.B. okzipital"/>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Lateralität">
                <Select value={draft.laterality} options={LATERALITY} onChange={v => upd(['laterality'], v)}/>
              </Field>
              {wave && (
                <Field label="Feldplausibilität">
                  <Select value={wave.field_distribution.field_plausibility} options={FIELD_PLAUS}
                    onChange={v => upd(['field_distribution','field_plausibility'], v)}/>
                </Field>
              )}
            </div>
            {wave && (
              <>
                <Field label="Phasenumkehr">
                  <Select value={wave.field_distribution.phase_reversal} options={PHASE_REVERSAL}
                    onChange={v => upd(['field_distribution','phase_reversal'], v)}/>
                </Field>
                <Field label="Feldbeschreibung">
                  <TArea value={wave.field_distribution.description}
                    onChange={v => upd(['field_distribution','description'], v)} rows={2}/>
                </Field>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Klinik ── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <SectionHeader title="Klinik & Kontext" icon="🏥" open={!!open.klinik} onToggle={() => toggleSection('klinik')}/>
        {open.klinik && (
          <div className="px-4 py-4 space-y-4">
            {wave && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="Altersgruppe">
                  <Select value={wave.age_group} options={AGE_GROUP} onChange={v => upd(['age_group'], v)}/>
                </Field>
                <Field label="Schlafstadium">
                  <Select value={wave.sleep_stage} options={SLEEP_STAGE} onChange={v => upd(['sleep_stage'], v)}/>
                </Field>
                <Field label="Krankheitswert">
                  <Select value={wave.disease_value} options={DISEASE_VALUE} onChange={v => upd(['disease_value'], v)}/>
                </Field>
                <Field label="Häufigkeit">
                  <Select value={wave.occurrence_frequency} options={OCCURRENCE_FREQ}
                    onChange={v => upd(['occurrence_frequency'], v)}/>
                </Field>
              </div>
            )}
            {wave && (
              <Field label="Auftrittskontexte">
                <TagInput values={wave.occurrence_context} onChange={v => upd(['occurrence_context'], v)}
                  placeholder="z.B. wach_entspannt"/>
              </Field>
            )}
            {art && (
              <>
                <Field label="Patientenkontext">
                  <TagInput values={art.patient_context} onChange={v => upd(['patient_context'], v)}/>
                </Field>
                <Field label="Auslösesituation">
                  <TagInput values={art.triggering_situation} onChange={v => upd(['triggering_situation'], v)}/>
                </Field>
                <Field label="Klinische Relevanz">
                  <TArea value={art.clinical_relevance} onChange={v => upd(['clinical_relevance'], v)} rows={2}/>
                </Field>
                <Field label="Provokation / Check">
                  <TagInput values={art.provocation_or_check} onChange={v => upd(['provocation_or_check'], v)}/>
                </Field>
                <Field label="Korrekturmaßnahme">
                  <TagInput values={art.correction_intervention} onChange={v => upd(['correction_intervention'], v)}/>
                </Field>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Logik ── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <SectionHeader title="Diagnose-Logik" icon="🔍" open={!!open.logik} onToggle={() => toggleSection('logik')}/>
        {open.logik && (
          <div className="px-4 py-4 space-y-4">
            <Field label="Schlüsselmerkmale (key_features)">
              <TagInput values={draft.dialog_logic.key_features}
                onChange={v => upd(['dialog_logic','key_features'], v)}/>
            </Field>
            <Field label="Kriterien dafür (criteria_for)">
              <TagInput values={draft.dialog_logic.criteria_for}
                onChange={v => upd(['dialog_logic','criteria_for'], v)}/>
            </Field>
            <Field label="Kriterien dagegen (criteria_against)">
              <TagInput values={draft.dialog_logic.criteria_against}
                onChange={v => upd(['dialog_logic','criteria_against'], v)}/>
            </Field>
            {wave && (
              <Field label="Differentialdiagnosen (IDs, z.B. EEG_0002)">
                <TagInput values={wave.differential_diagnoses}
                  onChange={v => upd(['differential_diagnoses'], v)} placeholder="EEG_XXXX"/>
              </Field>
            )}
            <Field label="Häufige Fehlinterpretationen">
              <TagInput values={draft.common_misinterpretations}
                onChange={v => upd(['common_misinterpretations'], v)}/>
            </Field>
          </div>
        )}
      </div>

      {/* ── Montage ── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <SectionHeader title="Montage-Verhalten" icon="⚡" open={!!open.montage} onToggle={() => toggleSection('montage')}/>
        {open.montage && (
          <div className="px-4 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bipolare Längsreihe">
                <TArea value={draft.montage_behavior.bipolar_longitudinal}
                  onChange={v => upd(['montage_behavior','bipolar_longitudinal'], v)} rows={2}/>
              </Field>
              <Field label="Bipolare Querreihe">
                <TArea value={draft.montage_behavior.bipolar_transverse}
                  onChange={v => upd(['montage_behavior','bipolar_transverse'], v)} rows={2}/>
              </Field>
              <Field label="Referenz Cz">
                <TArea value={draft.montage_behavior.referential_cz}
                  onChange={v => upd(['montage_behavior','referential_cz'], v)} rows={2}/>
              </Field>
              <Field label="Referenz Average">
                <TArea value={draft.montage_behavior.referential_average}
                  onChange={v => upd(['montage_behavior','referential_average'], v)} rows={2}/>
              </Field>
              <Field label="Referenz Mastoid">
                <TArea value={draft.montage_behavior.referential_mastoid}
                  onChange={v => upd(['montage_behavior','referential_mastoid'], v)} rows={2}/>
              </Field>
              <Field label="Beste Montage">
                <TArea value={draft.montage_behavior.best_montage}
                  onChange={v => upd(['montage_behavior','best_montage'], v)} rows={2}/>
              </Field>
            </div>
            <Field label="Pitfalls / Fallstricke">
              <TArea value={draft.montage_behavior.pitfalls}
                onChange={v => upd(['montage_behavior','pitfalls'], v)} rows={3}/>
            </Field>
          </div>
        )}
      </div>

      {/* ── Meta ── */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <SectionHeader title="Meta" icon="🗂" open={!!open.meta} onToggle={() => toggleSection('meta')}/>
        {open.meta && (
          <div className="px-4 py-4 space-y-4">
            <Field label="Quellen-Notizen">
              <TagInput values={draft.source_notes} onChange={v => upd(['source_notes'], v)}
                placeholder="z.B. Niedermeyer 6th ed."/>
            </Field>
            <Field label="Priorität für MVP">
              <Select value={draft.priority_for_mvp}
                options={['hoch','mittel','niedrig']}
                onChange={v => upd(['priority_for_mvp'], v)}/>
            </Field>
          </div>
        )}
      </div>

      {/* ── Sticky Save Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white px-4 py-3 flex items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)' }}>
        <div className="text-xs text-slate-500">
          {hasChanges
            ? <span className="text-amber-600 font-semibold">{diffs.length} ungespeicherte Änderung{diffs.length !== 1 ? 'en' : ''}</span>
            : <span className="text-slate-400">Keine Änderungen</span>
          }
        </div>
        <div className="flex gap-2">
          <button type="button"
            onClick={() => setDraft(JSON.parse(JSON.stringify(entity)))}
            disabled={!hasChanges}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40">
            Zurücksetzen
          </button>
          <button type="button"
            onClick={() => setShowDiff(true)}
            disabled={!hasChanges}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-40">
            Speichern…
          </button>
        </div>
      </div>
    </div>
  )
}
