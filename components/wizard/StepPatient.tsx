'use client'

import { useState } from 'react'
import type { StepAnswer } from '@/hooks/useWizardState'

// ─── Typen ────────────────────────────────────────────────────────────────────

export interface PatientAnswer {
  alter: string             // 'neonatal' | 'kleinkind' | 'kind' | 'jugendlicher' | 'erwachsen' | 'aelter' | ''
  vigilanz: string
  wachZustand: string
  schlafStadium: string
  bewusstseinGrad: string
  medikamente: string[]
}

const DEFAULT: PatientAnswer = {
  alter: '',
  vigilanz: '',
  wachZustand: '',
  schlafStadium: '',
  bewusstseinGrad: '',
  medikamente: [],
}

// ─── Alterskategorien ─────────────────────────────────────────────────────────

const ALTER_GRUPPEN: {
  value: string
  label: string
  range: string
  hinweis: string
  color: string
  activeBg: string
  activeBorder: string
  activeText: string
}[] = [
  {
    value: 'neonatal',
    label: 'Neonatal',
    range: '0–4 Wo.',
    hinweis: 'Burst-Suppression physiologisch, unreifer Grundrhythmus, keine stabilen Schlafspindeln',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    activeBg: 'bg-violet-600', activeBorder: 'border-violet-600', activeText: 'text-white',
  },
  {
    value: 'kleinkind',
    label: 'Kleinkind',
    range: '1 Mo.–3 J.',
    hinweis: 'Grundrhythmus 4–6 Hz normal, hohe Amplituden, POSTS noch unreif',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    activeBg: 'bg-blue-600', activeBorder: 'border-blue-600', activeText: 'text-white',
  },
  {
    value: 'kind',
    label: 'Kind',
    range: '3–12 J.',
    hinweis: 'PDR 8–9 Hz, okzipitale Slow Waves physiologisch, POSTS reif ab ca. 4 J.',
    color: 'bg-sky-50 border-sky-200 text-sky-700',
    activeBg: 'bg-sky-500', activeBorder: 'border-sky-500', activeText: 'text-white',
  },
  {
    value: 'jugendlicher',
    label: 'Jugendl.',
    range: '12–18 J.',
    hinweis: 'PDR 9–11 Hz, hypnagoge Hypersynchronie, Photic Driving gut ausgeprägt',
    color: 'bg-teal-50 border-teal-200 text-teal-700',
    activeBg: 'bg-teal-500', activeBorder: 'border-teal-500', activeText: 'text-white',
  },
  {
    value: 'erwachsen',
    label: 'Erwachsen',
    range: '18–60 J.',
    hinweis: 'PDR 8–12 Hz, Schlafspindeln 12–14 Hz, Beta frontozentral normal',
    color: 'bg-slate-50 border-slate-200 text-slate-700',
    activeBg: 'bg-slate-700', activeBorder: 'border-slate-700', activeText: 'text-white',
  },
  {
    value: 'aelter',
    label: 'Geriatrisch',
    range: '> 60 J.',
    hinweis: 'PDR-Verlangsamung auf 8–9 Hz normal, Theta-Anteil erhöht, temporal leichtes Slowing benigne',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    activeBg: 'bg-amber-600', activeBorder: 'border-amber-600', activeText: 'text-white',
  },
]

const VIGILANZ_OPTIONS = [
  { value: 'wach',               label: 'Wach',                  icon: '👁',  description: 'Patient wach und kooperativ' },
  { value: 'schlaefrig',         label: 'Schläfrig',             icon: '😪', description: 'Schläfrigkeit, leicht erweckbar' },
  { value: 'schlafend',          label: 'Schlafend',             icon: '😴', description: 'Spontanschlaf oder Schlafentzugs-EEG' },
  { value: 'bewusstseinsgestoert', label: 'Bewusstseinsstörung', icon: '🏥', description: 'Verwirrtheit, Stupor, Koma' },
]

const WACH_SUBSTATES = [
  { value: 'entspannt',        label: 'Entspannt, Augen geschlossen' },
  { value: 'augen_offen',      label: 'Augen offen' },
  { value: 'hyperventilation', label: 'Während / nach Hyperventilation' },
  { value: 'photic',           label: 'Während / nach Photostimulation' },
]

const SCHLAF_STADIEN = [
  { value: 'n1',       label: 'N1', description: 'Einschlaf' },
  { value: 'n2',       label: 'N2', description: 'Leichtschlaf' },
  { value: 'n3',       label: 'N3', description: 'Tiefschlaf' },
  { value: 'rem',      label: 'REM', description: 'Traumschlaf' },
  { value: 'unbekannt', label: 'Unklar', description: 'Stadium nicht sicher' },
]

const BEWUSSTSEIN_GRADE = [
  { value: 'leicht', label: 'Leicht',  description: 'Verwirrt, desorientiert' },
  { value: 'mittel', label: 'Mittel',  description: 'Somnolenz, eingeschränkt erweckbar' },
  { value: 'schwer', label: 'Schwer',  description: 'Sopor, nur auf Schmerzreiz' },
  { value: 'koma',   label: 'Koma',   description: 'Keine Reaktion auf Außenreize' },
]

const MEDIKAMENTE = [
  {
    group: 'Sedativa / Anästhetika',
    items: [
      { value: 'benzo',       label: 'Benzodiazepine',       hint: 'Beta↑, Spindeln↑' },
      { value: 'barbiturate', label: 'Barbiturate / Propofol', hint: 'Beta↑ → Burst-Suppression' },
      { value: 'ketamin',     label: 'Ketamin',              hint: 'Theta/Delta, keine BS' },
    ],
  },
  {
    group: 'Antiepileptika',
    items: [
      { value: 'aed_allgemein', label: 'AED (allgemein)',      hint: 'Hintergrund verlangsamt' },
      { value: 'phenytoin',     label: 'Phenytoin / Fosphenyt.', hint: 'Beta↑' },
    ],
  },
  {
    group: 'Psychopharmaka',
    items: [
      { value: 'antipsychotika', label: 'Antipsychotika',    hint: 'Theta↑, Slowing' },
      { value: 'tca',            label: 'TZA / Trizyklika',  hint: 'Slowing, Spike-Potenz.' },
      { value: 'lithium',        label: 'Lithium',           hint: 'Slowing, Spike-Potenz.' },
      { value: 'ssri',           label: 'SSRI / SNRI',       hint: 'Meist gering' },
    ],
  },
  {
    group: 'Sonstige',
    items: [
      { value: 'opioide',     label: 'Opioide',            hint: 'Delta↑, Slowing' },
      { value: 'andere_zns',  label: 'Andere ZNS-wirksame', hint: 'unspezifisch' },
    ],
  },
]

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function parse(value: StepAnswer): PatientAnswer {
  try {
    if (typeof value === 'string' && value.startsWith('{')) return { ...DEFAULT, ...JSON.parse(value) }
  } catch {}
  return DEFAULT
}

function isComplete(a: PatientAnswer): boolean {
  return a.vigilanz !== '' && a.alter !== ''
}

// ─── Sub-Komponenten ──────────────────────────────────────────────────────────

function SubStateSelector({
  label, options, value, onChange, optional,
}: {
  label: string
  options: { value: string; label: string; description?: string }[]
  value: string
  onChange: (v: string) => void
  optional?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {optional && <span className="text-xs text-slate-400 italic">optional</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
              value === opt.value
                ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            {opt.label}
            {opt.description && <span className="ml-1.5 text-xs opacity-60">{opt.description}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

interface Props {
  value: StepAnswer
  onChange: (v: StepAnswer) => void
}

export default function StepPatient({ value, onChange }: Props) {
  const [answer, setAnswer] = useState<PatientAnswer>(parse(value))
  const [showMedikamente, setShowMedikamente] = useState(parse(value).medikamente.length > 0)

  function update(patch: Partial<PatientAnswer>) {
    const next = { ...answer, ...patch }
    setAnswer(next)
    onChange(JSON.stringify(next))
  }

  function toggleMedikament(val: string) {
    const next = answer.medikamente.includes(val)
      ? answer.medikamente.filter(m => m !== val)
      : [...answer.medikamente, val]
    update({ medikamente: next })
  }

  function handleVigilanzClick(v: string) {
    if (answer.vigilanz === v) {
      update({ vigilanz: '', wachZustand: '', schlafStadium: '', bewusstseinGrad: '' })
    } else {
      update({ vigilanz: v, wachZustand: '', schlafStadium: '', bewusstseinGrad: '' })
    }
  }

  const selectedAlter = ALTER_GRUPPEN.find(a => a.value === answer.alter)
  const complete = isComplete(answer)

  return (
    <div className="space-y-6">

      {/* ── Alterskategorie ── */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alterskategorie</h3>
        <div className="grid grid-cols-3 gap-2">
          {ALTER_GRUPPEN.map(ag => {
            const active = answer.alter === ag.value
            return (
              <button
                key={ag.value}
                onClick={() => update({ alter: active ? '' : ag.value })}
                className={`text-left rounded-xl border px-3 py-2.5 transition-all ${
                  active
                    ? `${ag.activeBg} ${ag.activeBorder} ${ag.activeText}`
                    : `${ag.color} hover:opacity-90`
                }`}
              >
                <div className="font-semibold text-sm">{ag.label}</div>
                <div className={`text-[10px] mt-0.5 ${active ? 'opacity-80' : 'opacity-70'}`}>{ag.range}</div>
              </button>
            )
          })}
        </div>

        {/* Altershinweis */}
        {selectedAlter && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-medium">{selectedAlter.label} ({selectedAlter.range}):</span> {selectedAlter.hinweis}
          </div>
        )}
      </div>

      {/* ── Vigilanz ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vigilanz</h3>
        <div className="grid grid-cols-2 gap-2">
          {VIGILANZ_OPTIONS.map(opt => {
            const active = answer.vigilanz === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => handleVigilanzClick(opt.value)}
                className={`text-left rounded-xl border p-4 transition-all ${
                  active
                    ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{opt.icon}</span>
                  <span className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                    {opt.label}
                  </span>
                </div>
                <div className="text-xs text-slate-500">{opt.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Substates */}
      {answer.vigilanz === 'wach' && (
        <SubStateSelector
          label="Situation während der Ableitung"
          options={WACH_SUBSTATES}
          value={answer.wachZustand}
          onChange={v => update({ wachZustand: v })}
          optional
        />
      )}
      {answer.vigilanz === 'schlafend' && (
        <SubStateSelector
          label="Schlafstadium (AASM)"
          options={SCHLAF_STADIEN}
          value={answer.schlafStadium}
          onChange={v => update({ schlafStadium: v })}
          optional
        />
      )}
      {answer.vigilanz === 'bewusstseinsgestoert' && (
        <>
          <SubStateSelector
            label="Ausprägung"
            options={BEWUSSTSEIN_GRADE}
            value={answer.bewusstseinGrad}
            onChange={v => update({ bewusstseinGrad: v })}
            optional
          />
          <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            <svg className="mt-0.5 w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            Bei Bewusstseinsstörung: ACNS-Terminologie 2021 — generalisiertes Slowing und Suppressionsmuster besonders relevant.
          </div>
        </>
      )}

      {/* ── Medikamente ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Relevante Medikamente
            <span className="ml-2 normal-case font-normal tracking-normal text-slate-400 italic">optional</span>
          </h3>
          <button
            onClick={() => setShowMedikamente(s => !s)}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showMedikamente ? 'Ausblenden' : 'Anzeigen'}
          </button>
        </div>

        {answer.medikamente.length > 0 && !showMedikamente && (
          <div className="flex flex-wrap gap-1.5">
            {answer.medikamente.map(m => {
              const label = MEDIKAMENTE.flatMap(g => g.items).find(i => i.value === m)?.label ?? m
              return (
                <span key={m} className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                  {label}
                </span>
              )
            })}
          </div>
        )}

        {showMedikamente && (
          <div className="space-y-4">
            {MEDIKAMENTE.map(group => (
              <div key={group.group} className="space-y-2">
                <p className="text-xs font-medium text-slate-500">{group.group}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map(item => {
                    const active = answer.medikamente.includes(item.value)
                    return (
                      <button
                        key={item.value}
                        onClick={() => toggleMedikament(item.value)}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition-all text-left ${
                          active
                            ? 'border-violet-400 bg-violet-50 text-violet-700 font-medium'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {item.label}
                        <span className="ml-1.5 text-xs opacity-60">{item.hint}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!complete && (
        <p className="text-xs text-slate-400 text-center">Bitte Alterskategorie und Vigilanz auswählen.</p>
      )}

    </div>
  )
}
