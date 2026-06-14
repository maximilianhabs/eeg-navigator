import type { DataStatus } from '@/lib/types'

// ─── Kombinierter Badge (Classification + Krankheitswert = ein Feld) ──────────

type CombinedConfig = { label: string; classes: string }

function getCombined(classification: string, diseaseValue: string): CombinedConfig {
  // Epileptiform immer rot, unabhängig vom Krankheitswert
  if (classification === 'epileptiform')
    return { label: 'Epileptiform', classes: 'bg-red-50 text-red-700 ring-red-200' }

  // Hochpathologisch (z.B. Burst-Suppression, GPDs)
  if (diseaseValue === 'hochpathologisch')
    return { label: 'Hochpathologisch', classes: 'bg-red-100 text-red-800 ring-red-300' }

  // Pathologisch nicht-epileptiform
  if (classification === 'pathologisch_nicht_epileptiform')
    return { label: 'Pathologisch', classes: 'bg-orange-50 text-orange-700 ring-orange-200' }

  // Benigne Variante
  if (classification === 'benigne_variante')
    return { label: 'Benigne Variante', classes: 'bg-teal-50 text-teal-700 ring-teal-200' }

  // Physiologisch (kein Krankheitswert)
  if (classification === 'physiologisch')
    return { label: 'Physiologisch', classes: 'bg-blue-50 text-blue-700 ring-blue-200' }

  // Kontextabhängig
  if (classification === 'kontextabhaengig' || diseaseValue === 'kontextabhaengig')
    return { label: 'Kontextabhängig', classes: 'bg-purple-50 text-purple-700 ring-purple-200' }

  // Pädiatrisch / altersabhängig
  if (classification === 'paediatrisch_altersabhaengig')
    return { label: 'Pädiatrisch', classes: 'bg-pink-50 text-pink-700 ring-pink-200' }

  return { label: classification, classes: 'bg-slate-50 text-slate-600 ring-slate-200' }
}

export function CombinedBadge({ classification, diseaseValue }: {
  classification: string
  diseaseValue: string
}) {
  const cfg = getCombined(classification, diseaseValue)
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset shrink-0 ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

// ─── Status-Badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<DataStatus, { label: string; classes: string }> = {
  complete:  { label: 'Complete',  classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  partial:   { label: 'Partial',   classes: 'bg-amber-50 text-amber-700 ring-amber-200' },
  skeleton:  { label: 'Skeleton',  classes: 'bg-slate-50 text-slate-500 ring-slate-200' },
  verified:  { label: 'Verified',  classes: 'bg-blue-50 text-blue-700 ring-blue-200' },
}

export function StatusBadge({ status }: { status: DataStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.skeleton
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

// ─── Klassifikations-Badge ────────────────────────────────────────────────────

const classConfig: Record<string, string> = {
  physiologisch:                    'bg-blue-50 text-blue-700 ring-blue-200',
  benigne_variante:                 'bg-teal-50 text-teal-700 ring-teal-200',
  epileptiform:                     'bg-red-50 text-red-700 ring-red-200',
  pathologisch_nicht_epileptiform:  'bg-orange-50 text-orange-700 ring-orange-200',
  kontextabhaengig:                 'bg-purple-50 text-purple-700 ring-purple-200',
  paediatrisch_altersabhaengig:     'bg-pink-50 text-pink-700 ring-pink-200',
}

const classLabels: Record<string, string> = {
  physiologisch:                    'Physiologisch',
  benigne_variante:                 'Benigne Variante',
  epileptiform:                     'Epileptiform',
  pathologisch_nicht_epileptiform:  'Pathologisch',
  kontextabhaengig:                 'Kontextabhängig',
  paediatrisch_altersabhaengig:     'Pädiatrisch',
}

export function ClassificationBadge({ classification }: { classification: string }) {
  const classes = classConfig[classification] ?? 'bg-slate-50 text-slate-600 ring-slate-200'
  const label = classLabels[classification] ?? classification
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}>
      {label}
    </span>
  )
}

// ─── Krankheitswert-Badge ─────────────────────────────────────────────────────

const diseaseConfig: Record<string, string> = {
  kein:              'bg-slate-50 text-slate-500 ring-slate-200',
  gering:            'bg-yellow-50 text-yellow-700 ring-yellow-200',
  mittel:            'bg-orange-50 text-orange-700 ring-orange-200',
  hoch:              'bg-red-50 text-red-700 ring-red-200',
  hochpathologisch:  'bg-red-100 text-red-800 ring-red-300',
  kontextabhaengig:  'bg-purple-50 text-purple-600 ring-purple-200',
}

export function DiseaseValueBadge({ value }: { value: string }) {
  const classes = diseaseConfig[value] ?? 'bg-slate-50 text-slate-500 ring-slate-200'
  const labels: Record<string, string> = {
    kein: 'Kein Krankheitswert',
    gering: 'Gering',
    mittel: 'Mittel',
    hoch: 'Hoch',
    hochpathologisch: 'Hochpathologisch',
    kontextabhaengig: 'Kontextabhängig',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}>
      {labels[value] ?? value}
    </span>
  )
}

// ─── Generischer Tag ──────────────────────────────────────────────────────────

export function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono bg-slate-100 text-slate-600">
      {label}
    </span>
  )
}
