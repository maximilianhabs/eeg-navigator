'use client'

import { useState } from 'react'
import type { StepAnswer } from '@/hooks/useWizardState'

export interface PhaenomenAnswer {
  verteilung: string    // 'generalisiert' | 'fokal' | 'hemisphärisch' | 'multifokal' | 'nb'
  auftreten: string     // 'einmalig' | 'intermittierend' | 'periodisch' | 'kontinuierlich' | 'nb'
}

const DEFAULT: PhaenomenAnswer = { verteilung: '', auftreten: '' }

function parse(v: StepAnswer): PhaenomenAnswer {
  try { if (typeof v === 'string' && v.startsWith('{')) return JSON.parse(v) } catch {}
  return DEFAULT
}

const VERTEILUNG = [
  {
    value: 'generalisiert',
    label: 'Generalisiert',
    description: 'Beide Hemisphären gleichzeitig, synchron oder bilateral',
    icon: '◎',
  },
  {
    value: 'fokal',
    label: 'Fokal / Regional',
    description: 'Auf eine Region oder Hemisphärenseite begrenzt',
    icon: '◉',
  },
  {
    value: 'hemisphärisch',
    label: 'Hemisphärisch',
    description: 'Gesamte Hemisphäre betroffen, kontralateral deutlich weniger',
    icon: '◑',
  },
  {
    value: 'multifokal',
    label: 'Multifokal',
    description: 'Mehrere unabhängige Foci, kein generalisiertes Muster',
    icon: '⊕',
  },
]

const AUFTRETEN = [
  {
    value: 'einmalig',
    label: 'Einmalig',
    description: 'Einzel-Transient, nicht wiederholt',
  },
  {
    value: 'intermittierend',
    label: 'Intermittierend',
    description: 'Wiederholt, unregelmäßige Abstände',
  },
  {
    value: 'periodisch',
    label: 'Periodisch',
    description: 'Regelmäßig wiederkehrend, konstantes Intervall',
  },
  {
    value: 'kontinuierlich',
    label: 'Kontinuierlich',
    description: 'Anhaltend ohne Unterbrechung',
  },
]

interface Props {
  value: StepAnswer
  onChange: (v: StepAnswer) => void
}

export default function StepPhaenomen({ value, onChange }: Props) {
  const [answer, setAnswer] = useState<PhaenomenAnswer>(parse(value))

  function update(patch: Partial<PhaenomenAnswer>) {
    const next = { ...answer, ...patch }
    setAnswer(next)
    onChange(JSON.stringify(next))
  }

  return (
    <div className="space-y-7">

      {/* Verteilung */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Räumliche Verteilung</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VERTEILUNG.map(opt => {
            const active = answer.verteilung === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => update({ verteilung: active ? '' : opt.value })}
                className={`text-left rounded-xl border p-3 transition-all ${
                  active
                    ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-lg leading-none ${active ? 'text-blue-500' : 'text-slate-400'}`}>
                    {opt.icon}
                  </span>
                  <span className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 ml-7">{opt.description}</p>
              </button>
            )
          })}
          {/* Nicht beurteilbar inline */}
          <button
            onClick={() => update({ verteilung: answer.verteilung === 'nb' ? '' : 'nb' })}
            className={`text-left rounded-xl border p-3 transition-all col-span-full sm:col-span-1 ${
              answer.verteilung === 'nb'
                ? 'border-slate-400 bg-slate-100'
                : 'border-dashed border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-sm text-slate-500">Nicht beurteilbar / unklar</span>
          </button>
        </div>
      </div>

      {/* Auftreten */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Zeitliches Auftreten</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AUFTRETEN.map(opt => {
            const active = answer.auftreten === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => update({ auftreten: active ? '' : opt.value })}
                className={`text-left rounded-xl border p-3 transition-all ${
                  active
                    ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`text-sm font-semibold block mb-0.5 ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-slate-500">{opt.description}</span>
              </button>
            )
          })}
          <button
            onClick={() => update({ auftreten: answer.auftreten === 'nb' ? '' : 'nb' })}
            className={`text-left rounded-xl border p-3 transition-all col-span-full sm:col-span-1 ${
              answer.auftreten === 'nb'
                ? 'border-slate-400 bg-slate-100'
                : 'border-dashed border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-sm text-slate-500">Nicht beurteilbar / unklar</span>
          </button>
        </div>

        {/* Periodisch-Hinweis */}
        {answer.auftreten === 'periodisch' && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            💡 Periodische Muster → ACNS-Terminologie beachten: LPDs, GPDs, BIPDs — Intervall und Morphologie dokumentieren.
          </div>
        )}
      </div>

    </div>
  )
}
