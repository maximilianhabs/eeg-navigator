'use client'

import { useState } from 'react'
import type { StepAnswer } from '@/hooks/useWizardState'

// ─── Typen ────────────────────────────────────────────────────────────────────

interface TechnikAnswer {
  sensitivitaet: string
  hfFilter: string
  nfFilter: string
  notch: string
  geschwindigkeit: string
  montage: string
}

const DEFAULT: TechnikAnswer = {
  sensitivitaet: '7',      // Vorauswahl Standard
  hfFilter: 'ok',
  nfFilter: 'ok',
  notch: 'an',
  geschwindigkeit: '30',
  montage: '',
}

function hasWarning(a: TechnikAnswer): boolean {
  return (
    a.sensitivitaet === 'andere' ||
    (a.hfFilter !== '' && a.hfFilter !== 'ok') ||
    (a.nfFilter !== '' && a.nfFilter !== 'ok') ||
    a.notch === 'aus' ||
    a.geschwindigkeit === 'andere'
  )
}

// ─── Technische Parameter: kompakte Leiste ───────────────────────────────────

const PARAMS: {
  key: keyof TechnikAnswer
  label: string
  unit: string
  standard: string
  standardLabel: string
  altValue: string
  altLabel: string
  warnMsg: string
}[] = [
  {
    key: 'sensitivitaet',
    label: 'Empf.',
    unit: 'µV/mm',
    standard: '7',
    standardLabel: '7',
    altValue: 'andere',
    altLabel: '≠ 7',
    warnMsg: 'Abweichende Empfindlichkeit — Amplitudenbeurteilung eingeschränkt.',
  },
  {
    key: 'hfFilter',
    label: 'HF',
    unit: 'Hz',
    standard: 'ok',
    standardLabel: '35–70',
    altValue: 'abw',
    altLabel: '≠ Std.',
    warnMsg: 'Abweichender HF-Filter — Spikes können verfälscht sein.',
  },
  {
    key: 'nfFilter',
    label: 'NF',
    unit: 'Hz',
    standard: 'ok',
    standardLabel: '0,5',
    altValue: 'abw',
    altLabel: '≥ 1 Hz',
    warnMsg: 'NF-Filter ≥ 1 Hz — Delta und SWA unterdrückt.',
  },
  {
    key: 'notch',
    label: 'Notch',
    unit: '',
    standard: 'an',
    standardLabel: '50 Hz',
    altValue: 'aus',
    altLabel: 'aus',
    warnMsg: 'Kein Notch-Filter — 50-Hz-Einstreuung möglich.',
  },
  {
    key: 'geschwindigkeit',
    label: 'Speed',
    unit: 'mm/s',
    standard: '30',
    standardLabel: '30',
    altValue: 'andere',
    altLabel: '≠ 30',
    warnMsg: 'Abweichende Geschwindigkeit — Frequenzbeurteilung eingeschränkt.',
  },
]

// ─── Montagen ────────────────────────────────────────────────────────────────

const MONTAGEN: {
  value: string
  label: string
  desc: string
  hint?: string
  warnHint?: string
}[] = [
  {
    value: 'bipolar_laengs',
    label: 'Bipol. Längs',
    desc: 'Doppelbanane — Standard',
    hint: 'Lokalisation via Phasenumkehr',
  },
  {
    value: 'bipolar_quer',
    label: 'Bipol. Quer',
    desc: 'Transversale Montage',
    hint: 'Lokalisation via Phasenumkehr',
  },
  {
    value: 'referenz_cz',
    label: 'Ref. Cz',
    desc: 'Vertex-Referenz',
    hint: 'Lokalisation via Amplitudenmaximum',
  },
  {
    value: 'referenz_avg',
    label: 'Avg Ref.',
    desc: 'Durchschnitt aller Elektroden',
    hint: 'Lokalisation via Amplitudenmaximum',
  },
  {
    value: 'referenz_ohr',
    label: 'Ohrreferenz',
    desc: 'A1 / A2 (ipsilateral)',
    hint: 'Lokalisation via Amplitudenmaximum',
    warnHint: 'Temporale Aktivität kann die Referenz kontaminieren — bes. bei temporalen Spikes.',
  },
  {
    value: 'andere',
    label: 'Andere',
    desc: 'Mehrere / nicht standard',
  },
]

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

interface Props {
  value: StepAnswer
  onChange: (v: StepAnswer) => void
}

export default function StepTechnik({ value, onChange }: Props) {
  const parsed: TechnikAnswer = (() => {
    try {
      if (typeof value === 'string' && value.startsWith('{')) return JSON.parse(value)
    } catch {}
    return DEFAULT
  })()

  const [answer, setAnswer] = useState<TechnikAnswer>(parsed)

  function update(key: keyof TechnikAnswer, val: string) {
    const next = { ...answer, [key]: val }
    setAnswer(next)
    onChange(JSON.stringify(next))
  }

  const warn = hasWarning(answer)
  const montageSelected = answer.montage !== ''

  // Warnmeldungen sammeln
  const warnings = PARAMS
    .filter(p => answer[p.key] !== '' && answer[p.key] !== p.standard)
    .map(p => p.warnMsg)
  const montageObj = MONTAGEN.find(m => m.value === answer.montage)
  if (montageObj?.warnHint) warnings.push(montageObj.warnHint)

  return (
    <div className="space-y-5">

      {/* ── Technikleiste ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Grundeinstellungen
          </h3>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            warn
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}>
            {warn ? '⚠ Abweichung' : '✓ Standard'}
          </span>
        </div>

        {/* Horizontal pills */}
        <div className="flex flex-wrap gap-2">
          {PARAMS.map(p => {
            const isStandard = answer[p.key] === p.standard
            const isAlt = answer[p.key] === p.altValue || (!isStandard && answer[p.key] !== '')
            return (
              <div
                key={p.key}
                className={`flex items-center gap-0 rounded-xl border overflow-hidden text-xs transition-all ${
                  isAlt
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-emerald-200 bg-emerald-50'
                }`}
              >
                {/* Label */}
                <span className={`px-2 py-1.5 font-semibold border-r ${
                  isAlt ? 'text-amber-700 border-amber-200' : 'text-emerald-700 border-emerald-200'
                }`}>
                  {p.label}
                </span>
                {/* Standard button */}
                <button
                  onClick={() => update(p.key, p.standard)}
                  className={`px-2.5 py-1.5 font-mono transition-colors ${
                    isStandard
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'text-slate-500 hover:bg-emerald-100'
                  }`}
                >
                  {p.standardLabel}{p.unit ? ` ${p.unit}` : ''}
                </button>
                {/* Alt button */}
                <button
                  onClick={() => update(p.key, p.altValue)}
                  className={`px-2.5 py-1.5 font-mono border-l transition-colors ${
                    isAlt
                      ? 'bg-amber-400 text-white font-bold border-amber-200'
                      : 'text-slate-400 hover:bg-amber-50 border-slate-200'
                  }`}
                >
                  {p.altLabel}
                </button>
              </div>
            )
          })}
        </div>

        {/* Warnung wenn Abweichungen */}
        {warnings.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 space-y-1">
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                <span className="mt-0.5 flex-shrink-0">⚠</span>{w}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ── Montage ── */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Montage</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MONTAGEN.map(m => {
            const active = answer.montage === m.value
            return (
              <button
                key={m.value}
                onClick={() => update('montage', active ? '' : m.value)}
                className={`text-left rounded-xl border p-3 transition-all text-sm ${
                  active
                    ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`font-semibold text-sm ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                  {m.label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
              </button>
            )
          })}
        </div>

        {/* Kontexthinweis zur Montage */}
        {montageSelected && montageObj && (
          <div className="space-y-1.5">
            {montageObj.hint && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                💡 <strong>{montageObj.label}:</strong> {montageObj.hint}
                {(answer.montage === 'bipolar_laengs' || answer.montage === 'bipolar_quer') && (
                  <> — das Maximum liegt an der Elektrode, wo die Polarität <strong>wechselt</strong>.</>
                )}
                {(answer.montage === 'referenz_cz' || answer.montage === 'referenz_avg' || answer.montage === 'referenz_ohr') && (
                  <> — die Elektrode mit dem <strong>größten Ausschlag</strong> liegt am nächsten zur Quelle.</>
                )}
              </div>
            )}
            {montageObj.warnHint && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                ⚠ {montageObj.warnHint}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
