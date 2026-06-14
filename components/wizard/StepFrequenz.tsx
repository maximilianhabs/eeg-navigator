'use client'

import { useState } from 'react'
import type { StepAnswer } from '@/hooks/useWizardState'

// ─── Typen ────────────────────────────────────────────────────────────────────

export interface FrequenzAnswer {
  band: string          // 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma' | 'gemischt' | 'kein_rhythmus' | 'nb'
  hzApprox: string      // optionaler Freitext, z. B. "3" oder "8–10"
  rhythmizitaet: string // 'rhythmisch' | 'arrhythmisch' | 'semirhythmisch' | 'burst' | 'nb'
}

const DEFAULT: FrequenzAnswer = { band: '', hzApprox: '', rhythmizitaet: '' }

function parse(v: StepAnswer): FrequenzAnswer {
  try { if (typeof v === 'string' && v.startsWith('{')) return JSON.parse(v) } catch {}
  return DEFAULT
}

function isDauerKurz(morphologieRaw?: string): boolean {
  try {
    const d = JSON.parse(morphologieRaw ?? '{}').dauer ?? ''
    return d === 'spike' || d === 'sharp'
  } catch { return false }
}

// ─── Daten ────────────────────────────────────────────────────────────────────

const BAENDER = [
  {
    value: 'delta',
    label: 'Delta',
    range: '0,5 – < 4 Hz',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    beispiele: 'FIRDA, OIRDA, N3-Schlaf, Burst-Suppression, Enzephalopathie, GPDs',
  },
  {
    value: 'theta',
    label: 'Theta',
    range: '4 – < 8 Hz',
    color: '#3b82f6',
    bg: '#eff6ff',
    beispiele: 'TIRDA, temporale Verlangsamung, Somnolenz, atypische Absence',
  },
  {
    value: 'alpha',
    label: 'Alpha',
    range: '8 – 13 Hz',
    color: '#10b981',
    bg: '#f0fdf4',
    beispiele: 'Grundrhythmus (PDR), µ-Rhythmus, Alpha-Koma, POST (8–9 Hz)',
  },
  {
    value: 'beta',
    label: 'Beta',
    range: '14 – 30 Hz',
    color: '#f59e0b',
    bg: '#fffbeb',
    beispiele: 'Medikamentös (BZD, Barbiturate), Arousal, aktiviertes EEG, SREDA',
  },
  {
    value: 'gamma',
    label: 'Gamma / schnell',
    range: '> 30 Hz',
    color: '#ef4444',
    bg: '#fef2f2',
    beispiele: 'HFO (High-Frequency Oscillations), iktaler Beginn, EMG-Kontamination',
  },
]

const SONDEROPTIONEN = [
  { value: 'gemischt',     label: 'Gemischt',              hint: 'Mehrere Bänder gleichzeitig sichtbar' },
  { value: 'kein_rhythmus', label: 'Kein dominanter Rhythmus', hint: 'Suppression, Isoelektrikum, chaotisch' },
]

const RHYTHMIZITAET = [
  {
    value: 'rhythmisch',
    label: 'Rhythmisch',
    beschreibung: 'Gleichförmig, konstante Frequenz',
    welle: '∿∿∿∿∿∿',
    hinweis: 'FIRDA, OIRDA, TIRDA — bei rhythmischem Delta/Theta immer an diese Muster denken',
  },
  {
    value: 'arrhythmisch',
    label: 'Arrhythmisch',
    beschreibung: 'Unregelmäßig, wechselnde Abstände',
    welle: '∿~∿∿~∿',
    hinweis: null,
  },
  {
    value: 'semirhythmisch',
    label: 'Semirhythmisch',
    beschreibung: 'Tendenziell regelmäßig, mit Variation',
    welle: '∿∿~∿∿~',
    hinweis: null,
  },
  {
    value: 'burst',
    label: 'Burst-artig',
    beschreibung: 'Gruppen mit Pausen dazwischen',
    welle: '∿∿∿__∿∿∿',
    hinweis: 'Schlafspindeln, Burst-Suppression, epileptiforme Serien',
  },
]

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

interface Props {
  value: StepAnswer
  onChange: (v: StepAnswer) => void
  morphologieAnswer?: string
}

export default function StepFrequenz({ value, onChange, morphologieAnswer }: Props) {
  const [answer, setAnswer] = useState<FrequenzAnswer>(parse(value))

  if (isDauerKurz(morphologieAnswer)) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center space-y-2">
        <div className="text-3xl">⏭</div>
        <p className="text-sm font-medium text-slate-700">Frequenzbestimmung nicht zutreffend</p>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Bei sehr kurzen Potentialen (Spike &lt; 80 ms, Sharp Wave 80–250 ms) ist eine Frequenzbestimmung
          nicht sinnvoll. Weiter zur Lokalisation.
        </p>
      </div>
    )
  }

  function update(patch: Partial<FrequenzAnswer>) {
    const next = { ...answer, ...patch }
    setAnswer(next)
    onChange(JSON.stringify(next))
  }

  const selectedBand = BAENDER.find(b => b.value === answer.band)

  return (
    <div className="space-y-7">

      {/* Frequenzband */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Dominantes Frequenzband
        </h3>

        <div className="flex flex-col gap-2">
          {BAENDER.map(b => {
            const active = answer.band === b.value
            return (
              <button
                key={b.value}
                onClick={() => update({ band: active ? '' : b.value })}
                className={`text-left rounded-xl border px-4 py-3 transition-all flex items-center justify-between gap-3 ${
                  active ? 'ring-1' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
                style={active ? {
                  borderColor: b.color,
                  backgroundColor: b.bg,
                  outlineColor: b.color,
                } : {}}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: b.color }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={active ? { color: b.color } : { color: '#1e293b' }}>
                        {b.label}
                      </span>
                      <span className="text-xs font-mono font-medium" style={active ? { color: b.color } : { color: '#94a3b8' }}>
                        {b.range}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{b.beispiele}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Sonderoptionen */}
        <div className="flex gap-2 flex-wrap">
          {SONDEROPTIONEN.map(opt => {
            const active = answer.band === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => update({ band: active ? '' : opt.value })}
                className={`rounded-lg border px-3 py-2 text-sm transition-all text-left ${
                  active
                    ? 'border-slate-500 bg-slate-100 text-slate-700 font-medium'
                    : 'border-dashed border-slate-300 text-slate-500 hover:border-slate-400'
                }`}
              >
                {opt.label}
                <span className="ml-1.5 text-xs opacity-60">{opt.hint}</span>
              </button>
            )
          })}
          <button
            onClick={() => update({ band: answer.band === 'nb' ? '' : 'nb' })}
            className={`rounded-lg border px-3 py-2 text-sm transition-all ${
              answer.band === 'nb'
                ? 'border-slate-400 bg-slate-100 text-slate-600 font-medium'
                : 'border-dashed border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            Nicht beurteilbar
          </button>
        </div>
      </div>

      {/* Ungefähre Hz — nur wenn Band gewählt und nicht nb/kein_rhythmus */}
      {answer.band && answer.band !== 'nb' && answer.band !== 'kein_rhythmus' && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Ungefähre Frequenz
            <span className="ml-2 normal-case font-normal tracking-normal italic text-slate-400">optional</span>
          </h3>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 w-fit">
            <span className="text-xs text-slate-400">ca.</span>
            <input
              type="text"
              value={answer.hzApprox}
              onChange={e => update({ hzApprox: e.target.value })}
              placeholder={
                selectedBand?.value === 'delta' ? '1–3' :
                selectedBand?.value === 'theta' ? '5–7' :
                selectedBand?.value === 'alpha' ? '9–11' :
                selectedBand?.value === 'beta'  ? '18–22' : '...'
              }
              className="w-16 text-center text-base font-bold text-slate-700 bg-transparent border-none outline-none placeholder-slate-300"
            />
            <span className="text-xs text-slate-400">Hz</span>
          </div>
          <p className="text-xs text-slate-400">
            Verfeinert das Matching — z. B. 3 Hz vs. 1,5 Hz Spike-Wave entscheidend für Absence-DD.
          </p>
        </div>
      )}

      {/* Rhythmizität — nur wenn Band gewählt */}
      {answer.band && answer.band !== 'nb' && answer.band !== 'kein_rhythmus' && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rhythmizität</h3>
          <div className="grid grid-cols-2 gap-2">
            {RHYTHMIZITAET.map(r => {
              const active = answer.rhythmizitaet === r.value
              return (
                <div key={r.value}>
                  <button
                    onClick={() => update({ rhythmizitaet: active ? '' : r.value })}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      active
                        ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                      {r.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.beschreibung}</p>
                    <p className={`text-sm font-mono mt-1 tracking-tight ${active ? 'text-blue-400' : 'text-slate-300'}`}>
                      {r.welle}
                    </p>
                  </button>
                  {active && r.hinweis && (
                    <div className="mt-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      💡 {r.hinweis}
                    </div>
                  )}
                </div>
              )
            })}
            <button
              onClick={() => update({ rhythmizitaet: answer.rhythmizitaet === 'nb' ? '' : 'nb' })}
              className={`text-left rounded-xl border p-3 transition-all ${
                answer.rhythmizitaet === 'nb'
                  ? 'border-slate-400 bg-slate-100'
                  : 'border-dashed border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-sm text-slate-500">Nicht beurteilbar</span>
            </button>
          </div>

          {/* Wichtige Differenzierung: rhythmisch Delta/Theta */}
          {answer.rhythmizitaet === 'rhythmisch' && (answer.band === 'delta' || answer.band === 'theta') && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 space-y-1">
              <p className="font-semibold">
                Rhythmisches {answer.band === 'delta' ? 'Delta' : 'Theta'} — wichtige DD beachten:
              </p>
              {answer.band === 'delta' && (
                <ul className="space-y-0.5 ml-1">
                  <li>· <strong>FIRDA</strong> (Frontal Intermittent Rhythmic Delta Activity) — frontal, bilateral, Wachzustand</li>
                  <li>· <strong>OIRDA</strong> (Occipital IRDA) — okzipital, Kinder, bei Augenschluss</li>
                  <li>· <strong>LRDA</strong> (Lateralized RDA) — lateralisiert, fokal strukturelle Läsion</li>
                </ul>
              )}
              {answer.band === 'theta' && (
                <ul className="space-y-0.5 ml-1">
                  <li>· <strong>TIRDA</strong> (Temporal Intermittent Rhythmic Theta) — temporal anterior, epileptiform verdächtig</li>
                  <li>· <strong>SREDA</strong> (Subclinical Rhythmic EEG Discharge of Adults) — Beta/Theta, bilateral, Erwachsene</li>
                </ul>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
