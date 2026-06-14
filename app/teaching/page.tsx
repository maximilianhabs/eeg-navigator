import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Teaching' }

import Link from 'next/link'

const MODULES = [
  {
    href: '/teaching/entwicklung',
    badge: 'Neu',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    icon: '🧠',
    color: 'border-emerald-200 hover:border-emerald-400',
    headColor: 'bg-emerald-50',
    title: 'Kindliche EEG-Entwicklung',
    subtitle: 'Neonatales EEG & Reifung',
    desc: 'PMA-abhängige Normvarianten, IBI-Grenzen, Schlafzustände, Graphoelemente und Transitionen von der Frühgeburt bis zum Schulkind.',
    tags: ['Neonatal', 'PMA', 'Diskontinuität', 'Trace Alternans', 'Delta Brush'],
  },
  {
    href: '/teaching/montage-wahl',
    badge: 'Teaching',
    badgeColor: 'bg-violet-100 text-violet-700',
    icon: '🗺',
    color: 'border-violet-200 hover:border-violet-400',
    headColor: 'bg-violet-50',
    title: 'Montageauswahl',
    subtitle: 'Stärken & Schwächen der Montagen',
    desc: 'Bipolarkette als räumlicher Hochpass, Referenzmontage als Felddetektor. Cancellation Effect, End-of-Chain-Effekt, interaktiver Vergleich.',
    tags: ['Bipolar', 'Referenz', 'Cancellation', 'Feldmessung'],
  },
  {
    href: '/teaching/montage',
    badge: 'Interaktiv',
    badgeColor: 'bg-blue-100 text-blue-700',
    icon: '⚡',
    color: 'border-blue-200 hover:border-blue-400',
    headColor: 'bg-blue-50',
    title: 'Phasenumkehr-Simulator',
    subtitle: 'Interaktives Feldmodell',
    desc: 'Gaußsches Feldmodell mit wählbarem Generator und Feldgröße. EEG-Kurven, Spannungstabelle, Kanalrechnung und automatische Phasenumkehr-Erkennung.',
    tags: ['Phasenumkehr', 'Feldmodell', 'Lokalisation', 'Dipol'],
  },
]

export default function TeachingPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-slate-900">Teaching</h1>
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs font-semibold text-violet-700">Lernmodule</span>
        </div>
        <p className="text-sm text-slate-500">
          Interaktive Erklärungen zu EEG-Grundlagen, Montagen und der kindlichen Hirnreifung.
        </p>
      </div>

      {/* Modul-Karten */}
      <div className="grid gap-4">
        {MODULES.map(m => (
          <Link key={m.href} href={m.href}
            className={`group block rounded-xl border-2 bg-white overflow-hidden transition-all hover:shadow-md ${m.color}`}>
            <div className={`${m.headColor} px-5 py-4 flex items-start gap-4`}>
              <span className="text-3xl flex-shrink-0 mt-0.5">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900">{m.title}</h2>
                  <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${m.badgeColor}`}>{m.badge}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{m.subtitle}</p>
              </div>
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform"
                fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
              </svg>
            </div>
            <div className="px-5 py-3 border-t border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed">{m.desc}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {m.tags.map(t => (
                  <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{t}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Hinweis */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Teaching-Module sind didaktische Hilfsmittel. Alle Inhalte basieren auf IFCN-Empfehlungen und klinischen Standards, ersetzen aber keine klinische Ausbildung.
      </div>
    </div>
  )
}
