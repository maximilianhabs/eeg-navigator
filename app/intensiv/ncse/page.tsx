'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, Callout, SelectableTile } from '@/components/ui'

// ── Types ────────────────────────────────────────────────────────────────────

type AcnsPattern =
  | 'GPDs' | 'LPDs' | 'BiPDs'
  | 'GRDA' | 'LRDA'
  | 'SIRPIDs' | 'BIRDs'
  | 'Seizure' | 'Other'

type PlusModifier = '+F' | '+R' | '+S' | '+FR'

type FreqRange = '<0.5' | '0.5-2.4' | '>=2.5'

type Verdict = 'definite' | 'possible' | 'none' | null

interface State {
  step: number
  // Step 0: Muster
  pattern: AcnsPattern | null
  plusMods: PlusModifier[]
  // Step 1: Frequenz
  freqRange: FreqRange | null
  dauer10s: boolean | null
  // Step 2: B1 Evolution
  freqEvolution: boolean | null
  morphEvolution: boolean | null
  spatialSpread: boolean | null
  // Step 3: B2 Klinik
  klinischZeichen: string[]
  klinischAssessed: boolean
  // Step 4: B3 AED
  aedDurchgefuehrt: boolean | null
  aedEEG: boolean | null
  aedKlinisch: boolean | null
}

const INIT: State = {
  step: 0,
  pattern: null, plusMods: [],
  freqRange: null, dauer10s: null,
  freqEvolution: null, morphEvolution: null, spatialSpread: null,
  klinischZeichen: [], klinischAssessed: false,
  aedDurchgefuehrt: null, aedEEG: null, aedKlinisch: null,
}

// ── Classification logic ─────────────────────────────────────────────────────

function classify(s: State): Verdict {
  // Criterion A
  if (s.freqRange === '>=2.5' && s.dauer10s === true) return 'definite'

  // Pattern too slow for Salzburg
  if (s.freqRange === '<0.5') return 'none'

  // B criteria evaluation
  const b1 = s.freqEvolution === true || s.morphEvolution === true || s.spatialSpread === true
  const b2 = s.klinischZeichen.length > 0 && s.klinischAssessed
  const b3pos = s.aedDurchgefuehrt === true && s.aedEEG === true && s.aedKlinisch === true
  const b3neg = s.aedDurchgefuehrt === true && (s.aedEEG === false || s.aedKlinisch === false)

  if (b1 || b2 || b3pos) return 'definite'
  if (b3neg) return 'none'
  if (s.klinischAssessed) return 'possible' // B criteria assessed, none met → IIUZ
  return null
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StepHeader({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all ${
            i < step ? 'bg-blue-500' : i === step ? 'bg-blue-300' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

function BtnRow({ onBack, onNext, nextLabel = 'Weiter', nextDisabled = false, isLast = false }:
  { onBack?: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean; isLast?: boolean }) {
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
      {onBack ? (
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16">
            <path strokeLinecap="round" d="M10 3L5 8l5 5"/>
          </svg>
          Zurück
        </button>
      ) : <div />}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
          isLast
            ? 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40'
            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed'
        }`}
      >
        {nextLabel}
        {!isLast && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16">
            <path strokeLinecap="round" d="M6 3l5 5-5 5"/>
          </svg>
        )}
      </button>
    </div>
  )
}

function ChoiceBtn({ label, desc, selected, onClick }: {
  label: string; desc?: string; selected: boolean; onClick: () => void
}) {
  return (
    <SelectableTile selected={selected} onClick={onClick}>
      <span className="font-semibold">{label}</span>
      {desc && (
        <span className="block text-xs mt-0.5 font-normal" style={{ color: 'var(--text-secondary)' }}>{desc}</span>
      )}
    </SelectableTile>
  )
}

function YesNo({ value, onChange, yesLabel = 'Ja', noLabel = 'Nein' }: {
  value: boolean | null; onChange: (v: boolean) => void; yesLabel?: string; noLabel?: string
}) {
  return (
    <div className="flex gap-3 mt-3">
      {[true, false].map(v => (
        <SelectableTile
          key={String(v)}
          selected={value === v}
          onClick={() => onChange(v)}
          layout="inline"
          className="font-medium"
        >
          {v ? yesLabel : noLabel}
        </SelectableTile>
      ))}
    </div>
  )
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <SelectableTile selected={checked} onClick={onChange} className="flex items-center gap-3">
      <div
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all"
        style={{
          backgroundColor: checked ? 'var(--brand)' : 'transparent',
          borderColor: checked ? 'var(--brand)' : 'var(--border-strong)',
        }}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 12 12">
            <path strokeLinecap="round" d="M2 6l3 3 5-5"/>
          </svg>
        )}
      </div>
      {label}
    </SelectableTile>
  )
}

// ── IIC Spectrum SVG ─────────────────────────────────────────────────────────

function IICSpectrum({ verdict }: { verdict: Verdict }) {
  // Position on spectrum: 0 = definitely interictal, 1 = definite NCSE
  const markerX = verdict === 'definite' ? 0.88
    : verdict === 'possible' ? 0.58
    : verdict === 'none' ? 0.15
    : 0.5

  const W = 520
  const H = 100
  const PAD = 24

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-lg" xmlns="http://www.w3.org/2000/svg">
      {/* Gradient bar */}
      <defs>
        <linearGradient id="specGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="65%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <rect x={PAD} y={28} width={W - 2 * PAD} height={22} rx={11} fill="url(#specGrad)" />

      {/* Zone labels */}
      {[
        { x: PAD + (W - 2 * PAD) * 0.1, label: 'Interikal' },
        { x: PAD + (W - 2 * PAD) * 0.5, label: 'IIC / IIUZ' },
        { x: PAD + (W - 2 * PAD) * 0.88, label: 'Iktal / NCSE' },
      ].map(({ x, label }) => (
        <text key={label} x={x} y={16} textAnchor="middle" fontSize={9} fill="#64748b" fontFamily="system-ui">{label}</text>
      ))}

      {/* Separator ticks */}
      {[0.35, 0.65].map(frac => {
        const x = PAD + (W - 2 * PAD) * frac
        return <line key={frac} x1={x} y1={28} x2={x} y2={50} stroke="white" strokeWidth={1.5} opacity={0.5} />
      })}

      {/* Marker */}
      <circle
        cx={PAD + (W - 2 * PAD) * markerX}
        cy={39}
        r={10}
        fill="white"
        stroke={verdict === 'definite' ? '#ef4444' : verdict === 'possible' ? '#f97316' : '#22c55e'}
        strokeWidth={2.5}
      />
      <text
        x={PAD + (W - 2 * PAD) * markerX}
        y={63}
        textAnchor="middle"
        fontSize={10}
        fill={verdict === 'definite' ? '#dc2626' : verdict === 'possible' ? '#ea580c' : '#16a34a'}
        fontFamily="system-ui"
        fontWeight="600"
      >
        ▲
      </text>

      {/* Bottom label */}
      <text x={W / 2} y={88} textAnchor="middle" fontSize={8} fill="#94a3b8" fontFamily="system-ui">
        Iktal-Interictal-Kontinuum nach Beniczky 2021 / ACNS 2021
      </text>
    </svg>
  )
}

// ── Step 0: ACNS-Muster ──────────────────────────────────────────────────────

const PATTERNS: { id: AcnsPattern; label: string; desc: string }[] = [
  { id: 'GPDs',     label: 'GPDs',     desc: 'Generalized Periodic Discharges' },
  { id: 'LPDs',     label: 'LPDs',     desc: 'Lateralized Periodic Discharges (ehem. PLEDs)' },
  { id: 'BiPDs',    label: 'BiPDs',    desc: 'Bilateral Independent Periodic Discharges' },
  { id: 'GRDA',     label: 'GRDA',     desc: 'Generalized Rhythmic Delta Activity' },
  { id: 'LRDA',     label: 'LRDA',     desc: 'Lateralized Rhythmic Delta Activity' },
  { id: 'SIRPIDs',  label: 'SIRPIDs',  desc: 'Stimulus-Induced Rhythmic, Periodic or Ictal Discharges' },
  { id: 'BIRDs',    label: 'BIRDs',    desc: 'Brief Ictal Rhythmic Discharges (<10 s)' },
  { id: 'Seizure',  label: 'Elektrographische Anfälle', desc: 'EDs ≥10 s ohne klinische Korrelate' },
  { id: 'Other',    label: 'Anderes rhythmisches Muster', desc: 'Triphasische Wellen, anderes periodisches Muster' },
]

const PLUS_MODS: { id: PlusModifier; label: string; desc: string }[] = [
  { id: '+F',  label: '+F',  desc: 'Fast — übergelagerter Schnellrhythmus ≥3 Hz' },
  { id: '+R',  label: '+R',  desc: 'Rhythmic — rhythmischer Aufbau' },
  { id: '+S',  label: '+S',  desc: 'Sharp/Spike — spitze Morphologie' },
  { id: '+FR', label: '+FR', desc: 'Fast + Rhythmic — kombinierter Modifier' },
]

function Step0({ s, set }: { s: State; set: (p: Partial<State>) => void }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-1">Schritt 1 — ACNS-Muster benennen</h2>
      <p className="text-xs text-slate-500 mb-4">Wähle das beobachtete EEG-Muster nach ACNS-Nomenklatur 2021.</p>

      <div className="space-y-2">
        {PATTERNS.map(p => (
          <ChoiceBtn
            key={p.id}
            label={p.label}
            desc={p.desc}
            selected={s.pattern === p.id}
            onClick={() => set({ pattern: p.id })}
          />
        ))}
      </div>

      {/* Plus modifiers */}
      {s.pattern && !['Seizure', 'BIRDs'].includes(s.pattern) && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-slate-600 mb-2">Plus-Modifier (Mehrfachauswahl möglich)</p>
          <div className="space-y-2">
            {PLUS_MODS.map(m => (
              <CheckItem
                key={m.id}
                label={`${m.label} — ${m.desc}`}
                checked={s.plusMods.includes(m.id)}
                onChange={() => set({
                  plusMods: s.plusMods.includes(m.id)
                    ? s.plusMods.filter(x => x !== m.id)
                    : [...s.plusMods, m.id],
                })}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">+F/+S/+FR erhöhen die Ikaogenität — werden bei der Bewertung berücksichtigt.</p>
        </div>
      )}
    </div>
  )
}

// ── Step 1: Frequenz & Dauer ─────────────────────────────────────────────────

const FREQ_OPTIONS: { id: FreqRange; label: string; desc: string }[] = [
  { id: '<0.5',    label: '< 0,5 Hz',    desc: 'Sehr langsam — Salzburger Kriterien greifen nicht' },
  { id: '0.5-2.4', label: '0,5 – 2,4 Hz', desc: 'Subiktal / IIC-Bereich — B-Kriterien erforderlich' },
  { id: '>=2.5',   label: '≥ 2,5 Hz',    desc: 'Kriterium A — potentiell definitiver NCSE' },
]

function Step1({ s, set }: { s: State; set: (p: Partial<State>) => void }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-1">Schritt 2 — Frequenz & Dauer</h2>
      <p className="text-xs text-slate-500 mb-4">
        Messung der Grundfrequenz des Musters (nicht des Plus-Modifiers).
        Zähle Perioden über 2 Sekunden und multipliziere mit 0,5.
      </p>

      <div className="space-y-2 mb-5">
        {FREQ_OPTIONS.map(opt => (
          <ChoiceBtn
            key={opt.id}
            label={opt.label}
            desc={opt.desc}
            selected={s.freqRange === opt.id}
            onClick={() => set({ freqRange: opt.id })}
          />
        ))}
      </div>

      {s.freqRange === '>=2.5' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 mb-4">
          <p className="text-sm font-semibold text-blue-800 mb-1">Kriterium A aktiv</p>
          <p className="text-xs text-blue-600">
            Bei ≥ 2,5 Hz ist Kriterium A erfüllbar ohne B-Kriterien — wenn das Muster ≥ 10 Sekunden anhält.
          </p>
        </div>
      )}

      {s.freqRange !== null && s.freqRange !== '<0.5' && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-1">
            Hält das Muster kontinuierlich ≥ 10 Sekunden an?
          </p>
          <YesNo
            value={s.dauer10s}
            onChange={v => set({ dauer10s: v })}
            yesLabel="Ja, ≥ 10 s"
            noLabel="Nein, kürzer"
          />
          {s.dauer10s === false && (
            <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Muster &lt; 10 s → BIRDs-Kategorie. Salzburger Kriterien für NCSE erfordern ≥ 10 s Persistenz. B-Kriterien können trotzdem erhoben werden.
            </p>
          )}
        </div>
      )}

      {s.freqRange === '<0.5' && (
        <Callout tone="neutral">
          Muster &lt; 0,5 Hz fällt nicht in die Salzburger Frequenzkriterien. Eine NCSE-Klassifikation nach Salzburg ist nicht anwendbar. Bitte klinischen Kontext und andere Kriterien heranziehen.
        </Callout>
      )}
    </div>
  )
}

// ── Step 2: B1 Evolution ─────────────────────────────────────────────────────

function Step2({ s, set }: { s: State; set: (p: Partial<State>) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">B1</span>
        <h2 className="text-base font-semibold text-slate-800">Schritt 3 — Spatiotemporale Evolution</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Gilt als erfüllt, wenn mindestens eines der folgenden Zeichen über ≥ 5 s beobachtbar ist.
      </p>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Frequenzevolution (Waxing / Waning)</p>
          <p className="text-xs text-slate-400 mb-2">Frequenzänderung &gt; 1 Hz über ≥ 5 Sekunden</p>
          <YesNo value={s.freqEvolution} onChange={v => set({ freqEvolution: v })} />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Morphologieevolution</p>
          <p className="text-xs text-slate-400 mb-2">Änderung der Wellenform (z.B. spitzer werdend, Amplitudenzu-/abnahme)</p>
          <YesNo value={s.morphEvolution} onChange={v => set({ morphEvolution: v })} />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Räumliche Ausbreitung</p>
          <p className="text-xs text-slate-400 mb-2">Propagation in benachbarte Elektroden / Hemisphären</p>
          <YesNo value={s.spatialSpread} onChange={v => set({ spatialSpread: v })} />
        </div>
      </div>

      {(s.freqEvolution === true || s.morphEvolution === true || s.spatialSpread === true) && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-semibold text-green-800">B1 erfüllt ✓</p>
          <p className="text-xs text-green-600 mt-0.5">Spatiotemporale Evolution nachgewiesen → Kriterium B1 positiv.</p>
        </div>
      )}
    </div>
  )
}

// ── Step 3: B2 Klinische Zeichen ─────────────────────────────────────────────

const KLIN_ZEICHEN = [
  'Augenseitenblick / Okulomotorische Deviation',
  'Nystagmus (ictal)',
  'Faziale Myoklonien / Zuckungen',
  'Automatismen (Lippen, manuelle, orale)',
  'Distales Myoklonus (Extremitäten)',
  'Seitenbetontes Pupillenphänomen',
]

function Step3({ s, set }: { s: State; set: (p: Partial<State>) => void }) {
  const toggle = (z: string) => set({
    klinischZeichen: s.klinischZeichen.includes(z)
      ? s.klinischZeichen.filter(x => x !== z)
      : [...s.klinischZeichen, z],
    klinischAssessed: true,
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">B2</span>
        <h2 className="text-base font-semibold text-slate-800">Schritt 4 — Klinische Zeichen</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Subtile iktale Phänomene, die mit dem EEG-Muster zeitlich korrelieren.
        Wähle alle zutreffenden aus.
      </p>

      <div className="space-y-2">
        {KLIN_ZEICHEN.map(z => (
          <CheckItem
            key={z}
            label={z}
            checked={s.klinischZeichen.includes(z)}
            onChange={() => toggle(z)}
          />
        ))}
      </div>

      {/* Keine Zeichen button */}
      <button
        onClick={() => set({ klinischZeichen: [], klinischAssessed: true })}
        className={`mt-3 w-full px-4 py-3 rounded-xl border text-sm text-left transition-all ${
          s.klinischAssessed && s.klinischZeichen.length === 0
            ? 'border-slate-400 bg-slate-100 text-slate-800 font-medium'
            : 'border-dashed border-slate-300 text-slate-500 hover:bg-slate-50'
        }`}
      >
        Keine klinischen Zeichen beobachtbar
      </button>

      {s.klinischZeichen.length > 0 && (
        <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
          <p className="text-sm font-semibold text-purple-800">B2 erfüllt ✓</p>
          <p className="text-xs text-purple-600 mt-0.5">{s.klinischZeichen.length} iktales Phänomen(e) dokumentiert.</p>
        </div>
      )}

      {s.klinischAssessed && s.klinischZeichen.length === 0 && (
        <p className="text-xs text-slate-500 mt-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          Kein B2-Kriterium. Falls auch B1 negativ: AED-Test (B3) oder IIUZ-Klassifikation.
        </p>
      )}
    </div>
  )
}

// ── Step 4: B3 AED-Test ──────────────────────────────────────────────────────

function Step4({ s, set }: { s: State; set: (p: Partial<State>) => void }) {
  const b1 = s.freqEvolution === true || s.morphEvolution === true || s.spatialSpread === true
  const b2 = s.klinischZeichen.length > 0

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">B3</span>
        <h2 className="text-base font-semibold text-slate-800">Schritt 5 — AED-Test</h2>
      </div>

      {(b1 || b2) && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-semibold text-green-800">B1/B2 bereits positiv</p>
          <p className="text-xs text-green-600 mt-0.5">
            {b1 && 'Spatiotemporale Evolution (B1) nachgewiesen. '}
            {b2 && 'Klinische Zeichen (B2) dokumentiert. '}
            Ein AED-Test ist nicht zwingend erforderlich — Diagnose wäre bereits "Definitiver NCSE".
            Der Test kann dennoch therapeutisch sinnvoll sein.
          </p>
        </div>
      )}

      <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
        <p className="text-xs font-semibold text-amber-700 mb-1">Protokoll (Salzburger Kriterien)</p>
        <ul className="text-xs text-amber-700 space-y-0.5">
          <li>• Benzodiazepine i.v.: Lorazepam 0,05 mg/kg ODER Diazepam 0,15 mg/kg</li>
          <li>• oder Levetiracetam 30–60 mg/kg i.v. (max. 4500 mg)</li>
          <li>• Valproat 30 mg/kg i.v. bei GPDs mit triphasischer Morphologie</li>
          <li className="mt-1 font-medium">Positiv = EEG-Besserung UND klinische Besserung</li>
        </ul>
      </div>

      <p className="text-sm font-medium text-slate-700 mb-2">Wurde ein AED-Test durchgeführt?</p>
      <YesNo
        value={s.aedDurchgefuehrt}
        onChange={v => set({ aedDurchgefuehrt: v, aedEEG: null, aedKlinisch: null })}
        yesLabel="Ja, durchgeführt"
        noLabel="Nein / nicht möglich"
      />

      {s.aedDurchgefuehrt === true && (
        <div className="mt-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">EEG-Besserung nach AED?</p>
            <p className="text-xs text-slate-400 mb-2">≥ 50 % Reduktion der Entladungsfrequenz oder Suppression des Musters</p>
            <YesNo value={s.aedEEG} onChange={v => set({ aedEEG: v })} />
          </div>

          {s.aedEEG !== null && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Klinische Besserung nach AED?</p>
              <p className="text-xs text-slate-400 mb-2">Verbesserung des Bewusstseinsstatus oder Rückgang klinischer Anfallszeichen</p>
              <YesNo value={s.aedKlinisch} onChange={v => set({ aedKlinisch: v })} />
            </div>
          )}

          {s.aedEEG !== null && s.aedKlinisch !== null && (
            <div className={`rounded-xl border px-4 py-3 ${
              s.aedEEG && s.aedKlinisch
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-100 bg-red-50 text-red-700'
            }`}>
              {s.aedEEG && s.aedKlinisch ? (
                <>
                  <p className="text-sm font-semibold">B3 positiv ✓</p>
                  <p className="text-xs mt-0.5">Sowohl EEG als auch klinische Besserung → Definitiver NCSE bestätigt.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">B3 negativ</p>
                  <p className="text-xs mt-0.5">
                    {!s.aedEEG && !s.aedKlinisch
                      ? 'Weder EEG- noch klinische Besserung → AED-Test negativ.'
                      : !s.aedEEG
                      ? 'Keine EEG-Besserung trotz klinischer Verbesserung → B3 negativ (EEG-Kriterium fehlt).'
                      : 'EEG-Besserung ohne klinische Korrelation → B3 negativ (klinisches Kriterium fehlt).'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {s.aedDurchgefuehrt === false && (
        <p className="text-xs text-slate-500 mt-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          Ohne AED-Test kann B3 nicht bewertet werden. Bei negativem B1 und B2 → IIUZ-Klassifikation. Ein empirischer Therapieversuch wird in diesem Fall empfohlen.
        </p>
      )}
    </div>
  )
}

// ── Step 5: Ergebnis ─────────────────────────────────────────────────────────

function Step5({ s, onReset }: { s: State; onReset: () => void }) {
  const verdict = classify(s)

  const b1 = s.freqEvolution === true || s.morphEvolution === true || s.spatialSpread === true
  const b2 = s.klinischZeichen.length > 0
  const b3pos = s.aedDurchgefuehrt === true && s.aedEEG === true && s.aedKlinisch === true
  const critA = s.freqRange === '>=2.5' && s.dauer10s === true

  const verdictConfig = {
    definite: {
      label: 'Definitiver NCSE',
      sublabel: 'Non-konvulsiver Status Epilepticus',
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-300',
      badge: 'bg-red-600',
      icon: '⚡',
    },
    possible: {
      label: 'Möglicher NCSE',
      sublabel: 'Iktal-Interictal-Uncertainty Zone (IIUZ)',
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      badge: 'bg-orange-500',
      icon: '⚠',
    },
    none: {
      label: 'Kein NCSE',
      sublabel: 'Iktal-Interiktales Kontinuum (IIC) / Interikal',
      color: 'text-slate-700',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      badge: 'bg-slate-500',
      icon: '✓',
    },
  }

  const cfg = verdictConfig[verdict ?? 'possible']

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-4">Ergebnis — Salzburger Klassifikation</h2>

      {/* Main verdict */}
      <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-5 mb-5`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">{cfg.icon}</span>
          <div>
            <p className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{cfg.sublabel}</p>
          </div>
        </div>

        {/* Criteria met */}
        <div className="mt-4 space-y-1.5">
          {critA && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-white/70 rounded-lg px-3 py-1.5">
              <span className="font-bold">A</span> EDs ≥ 2,5 Hz für ≥ 10 s — Kriterium A erfüllt
            </div>
          )}
          {b1 && (
            <div className="flex items-center gap-2 text-xs text-blue-700 bg-white/70 rounded-lg px-3 py-1.5">
              <span className="font-bold">B1</span> Spatiotemporale Evolution nachgewiesen
            </div>
          )}
          {b2 && (
            <div className="flex items-center gap-2 text-xs text-purple-700 bg-white/70 rounded-lg px-3 py-1.5">
              <span className="font-bold">B2</span> Subtile klinische Zeichen: {s.klinischZeichen.join(', ')}
            </div>
          )}
          {b3pos && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-white/70 rounded-lg px-3 py-1.5">
              <span className="font-bold">B3</span> AED-Test positiv (EEG + klinische Besserung)
            </div>
          )}
          {verdict === 'possible' && (
            <div className="flex items-center gap-2 text-xs text-orange-700 bg-white/70 rounded-lg px-3 py-1.5">
              Keine B-Kriterien erfüllt → IIUZ — empirischer Therapieversuch empfohlen
            </div>
          )}
          {verdict === 'none' && s.aedDurchgefuehrt === true && (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/70 rounded-lg px-3 py-1.5">
              AED-Test negativ — kein Ansprechen auf B3-Kriterien
            </div>
          )}
          {verdict === 'none' && s.freqRange === '<0.5' && (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/70 rounded-lg px-3 py-1.5">
              Frequenz &lt; 0,5 Hz — außerhalb der Salzburger Frequenzkriterien
            </div>
          )}
        </div>
      </div>

      {/* IIC Spectrum */}
      <Card padding="md" className="mb-5">
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Iktal-Interictal-Kontinuum</p>
        <IICSpectrum verdict={verdict} />
      </Card>

      {/* Pattern context */}
      {s.pattern && (
        <Card padding="md" className="mb-5">
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Bewertetes Muster</p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {s.pattern}
            {s.plusMods.length > 0 && <span className="text-blue-600"> {s.plusMods.join(' ')}</span>}
          </p>
          {s.freqRange && (
            <p className="text-xs text-slate-400 mt-1">
              Frequenz: {s.freqRange === '<0.5' ? '< 0,5 Hz' : s.freqRange === '0.5-2.4' ? '0,5–2,4 Hz' : '≥ 2,5 Hz'}
              {s.dauer10s !== null && ` · Dauer ≥ 10 s: ${s.dauer10s ? 'ja' : 'nein'}`}
            </p>
          )}
        </Card>
      )}

      {/* Clinical implications */}
      {verdict === 'definite' && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-4 text-xs text-red-700 space-y-1">
          <p className="font-semibold">Klinische Konsequenz — Definitiver NCSE</p>
          <p>Sofortige antikonvulsive Therapie erforderlich. Stufentherapie nach aktueller S2k-Leitlinie Status Epilepticus 2022.</p>
          <p>Kontinuierliches EEG-Monitoring empfohlen. Ätiologische Abklärung (CT/MRT, LP, Metabolik).</p>
        </div>
      )}
      {verdict === 'possible' && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 mb-4 text-xs text-orange-700 space-y-1">
          <p className="font-semibold">Klinische Konsequenz — IIUZ</p>
          <p>Empirischer AED-Therapieversuch empfohlen (Beniczky 2021). EEG- und klinisches Monitoring intensivieren.</p>
          <p>Wiederbeurteilung nach Therapieversuch → B3-Kriterien erneut evaluieren.</p>
        </div>
      )}
      {verdict === 'none' && (
        <Callout tone="neutral" title="Klinische Konsequenz — Kein NCSE" className="mb-4">
          Muster entspricht IIC oder interikatem Korrelat. Ursachensuche und supportive Therapie. Regelmäßiges EEG-Monitoring fortsetzen.
        </Callout>
      )}

      {/* References */}
      <div className="text-[10px] text-slate-400 space-y-0.5 mb-6">
        <p className="font-medium text-slate-500">Literatur</p>
        <p>Beniczky S et al. Standardized computer-based organized reporting of EEG. Epilepsia 2013.</p>
        <p>Leitinger M et al. Salzburg EEG criteria for non-convulsive status epilepticus. Lancet Neurol 2016.</p>
        <p>Beniczky S et al. Ictal-interictal continuum. Epilepsia 2021;62(6):1423–1435.</p>
        <p>Hirsch LJ et al. ACNS Standardized Critical Care EEG Terminology 2021 version. J Clin Neurophysiol 2021.</p>
        <p>Deutsche Gesellschaft für Neurologie. S2k-Leitlinie Status Epilepticus 2022.</p>
      </div>

      <button
        onClick={onReset}
        className="w-full py-3 rounded-xl border border-slate-200 text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors"
      >
        Neue Bewertung starten
      </button>
    </div>
  )
}

// ── Main wizard ──────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6

export default function NCSEPage() {
  const [s, setS] = useState<State>(INIT)

  const set = (patch: Partial<State>) => setS(prev => ({ ...prev, ...patch }))

  // Determine if we can skip to result (Criterion A)
  const critA = s.freqRange === '>=2.5' && s.dauer10s === true
  // Too slow for Salzburg
  const tooSlow = s.freqRange === '<0.5'

  // Step navigation logic
  const canGoNext = (() => {
    if (s.step === 0) return s.pattern !== null
    if (s.step === 1) return s.freqRange !== null && (s.freqRange === '<0.5' || s.dauer10s !== null)
    if (s.step === 2) return s.freqEvolution !== null && s.morphEvolution !== null && s.spatialSpread !== null
    if (s.step === 3) return s.klinischAssessed
    if (s.step === 4) {
      if (s.aedDurchgefuehrt === false) return true
      if (s.aedDurchgefuehrt === true) return s.aedEEG !== null && s.aedKlinisch !== null
      return false
    }
    return true
  })()

  const goNext = () => {
    if (s.step === 1 && (critA || tooSlow)) {
      // Skip to result
      setS(prev => ({ ...prev, step: 5 }))
      return
    }
    const b1 = s.freqEvolution === true || s.morphEvolution === true || s.spatialSpread === true
    const b2 = s.klinischZeichen.length > 0 && s.klinischAssessed
    if (s.step === 3 && (b1 || b2)) {
      // B1 or B2 met — can skip B3 or continue; we let user continue to B3 if they want
    }
    setS(prev => ({ ...prev, step: Math.min(5, prev.step + 1) }))
  }

  const goBack = () => {
    if (s.step === 5 && (critA || tooSlow)) {
      setS(prev => ({ ...prev, step: 1 }))
      return
    }
    setS(prev => ({ ...prev, step: Math.max(0, prev.step - 1) }))
  }

  const reset = () => setS(INIT)

  // Effective step count in progress bar (may skip steps for criterion A)
  const effectiveStep = s.step === 5 && (critA || tooSlow) ? 2 : s.step

  return (
    <div className="max-w-xl mx-auto py-4 pb-24 px-1">
      {/* Header */}
      <div className="mb-5">
        <Link href="/intensiv" className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-3 transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 10 10">
            <path strokeLinecap="round" d="M7 2L3 5l4 3"/>
          </svg>
          Intensiv & Bewusstseinsstörungen
        </Link>
        <h1 className="text-xl font-bold text-slate-900">NCSE-Klassifikation</h1>
        <p className="text-xs text-slate-500 mt-0.5">Salzburger Kriterien · ACNS 2021</p>
      </div>

      {/* Progress */}
      {s.step < 5 && (
        <div className="mb-5">
          <StepHeader step={s.step} total={TOTAL_STEPS} />
          <p className="text-[10px] text-slate-400 mt-1">Schritt {s.step + 1} von {TOTAL_STEPS}</p>
        </div>
      )}

      {/* Step content */}
      <Card elevated radius="lg">
        {s.step === 0 && <Step0 s={s} set={set} />}
        {s.step === 1 && <Step1 s={s} set={set} />}
        {s.step === 2 && <Step2 s={s} set={set} />}
        {s.step === 3 && <Step3 s={s} set={set} />}
        {s.step === 4 && <Step4 s={s} set={set} />}
        {s.step === 5 && <Step5 s={s} onReset={reset} />}

        {/* Criterion A shortcut hint */}
        {s.step === 1 && critA && (
          <p className="text-xs text-blue-600 mt-3 text-center">
            Kriterium A erfüllt — Weiter zum Ergebnis
          </p>
        )}

        {/* Nav */}
        {s.step < 5 && (
          <BtnRow
            onBack={s.step > 0 ? goBack : undefined}
            onNext={goNext}
            nextDisabled={!canGoNext}
            nextLabel={
              s.step === 1 && (critA || tooSlow) ? 'Zum Ergebnis' :
              s.step === 4 ? 'Ergebnis' : 'Weiter'
            }
          />
        )}
      </Card>

      {/* Skip to result if B1/B2 already met on step 2/3 */}
      {(s.step === 2 || s.step === 3) && (() => {
        const b1 = s.freqEvolution === true || s.morphEvolution === true || s.spatialSpread === true
        const b2 = s.klinischZeichen.length > 0
        if (!b1 && !b2) return null
        return (
          <button
            onClick={() => setS(prev => ({ ...prev, step: 5 }))}
            className="w-full mt-3 py-2.5 rounded-xl border border-green-200 bg-green-50 text-sm text-green-700 font-medium hover:bg-green-100 transition-colors"
          >
            {b1 ? 'B1 erfüllt' : 'B2 erfüllt'} — Direkt zum Ergebnis springen
          </button>
        )
      })()}
    </div>
  )
}
