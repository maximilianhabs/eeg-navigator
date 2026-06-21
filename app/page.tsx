import type { Metadata } from 'next'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { getAllArtefakte, getAllWellen, getWellenByCategory } from '@/lib/data'
import { AtlasView } from '@/components/AtlasView'
import { QuickAccess } from '@/components/QuickAccess'

export const metadata: Metadata = { title: 'Atlas' }

export default function AtlasPage() {
  const alleWellen = getAllWellen()
  const alleArtefakte = getAllArtefakte()
  const wellenByCategory = getWellenByCategory()
  const artefakteByCategory = alleArtefakte.reduce<Record<string, typeof alleArtefakte>>((acc, a) => {
    if (!acc[a.subcategory]) acc[a.subcategory] = []
    acc[a.subcategory].push(a)
    return acc
  }, {})
  const completeWellen = alleWellen.filter(e => e.data_status === 'complete').length
  const completeArtefakte = alleArtefakte.filter(e => e.data_status === 'complete').length
  const edfDir = path.join(process.cwd(), 'public', 'edf')
  const edfCount = fs.existsSync(edfDir) ? fs.readdirSync(edfDir).filter(f => f.endsWith('.edf')).length : 0
  const allEntities = [
    ...alleWellen.map(e => ({ id: e.id, name: e.name })),
    ...alleArtefakte.map(e => ({ id: e.id, name: e.name })),
  ]

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>EEG Atlas</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Regelbasiertes Nachschlagewerk für EEG-Phänomene und Artefakte
          </p>
        </div>
        <div className="flex gap-2">
          <StatPill label="Wellen" value={alleWellen.length} sub={`${completeWellen} vollständig`} color="blue" />
          <StatPill label="Artefakte" value={alleArtefakte.length} sub={`${completeArtefakte} vollständig`} color="amber" />
          <StatPill label="EDF-Snippets" value={edfCount} sub="10-Sek.-Beispiele" color="emerald" />
        </div>
      </div>

      {/* ── Module Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in delay-75">
        <ModuleCard
          href="/eeg-viewer"
          title="EEG-Viewer"
          description="Synthetische EEG-Kurven in bipolarer Längsreihe und Cz-Referenz."
          badge="Verfügbar"
          accentColor="#10b981"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2l2-6 2 12 2-8 2 4 2-2h4" />
            </svg>
          }
        />
        <ModuleCard
          href="/schlaf"
          title="Schlafstadien & Schlaf-EEG"
          description="NREM 1–3 und REM nach AASM 2012. Visuelle Schlafstadien-Klassifikation."
          badge="Verfügbar"
          accentColor="#10b981"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75 9.75 9.75 0 0 1 8.25 6c0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25 9.75 9.75 0 0 0 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
          }
        />
        <ModuleCard
          href="/intensiv"
          title="Intensiv & Bewusstseinsstörungen"
          description="Maligne EEG-Muster, ACNS-Klassifikation, ICU-EEG. ACNS 2021."
          badge="In Entwicklung"
          accentColor="#f59e0b"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
        <ModuleCard
          href="/teaching"
          title="Teaching"
          description="Kindliche EEG-Entwicklung, Montageauswahl, Phasenumkehr-Simulator."
          badge="Verfügbar"
          accentColor="#7c3aed"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          }
        />
      </div>

      {/* ── Quick Access: Lesezeichen + Zuletzt gesehen ── */}
      <QuickAccess allEntities={allEntities} />

      {/* ── Atlas ── */}
      <div className="animate-fade-in delay-150">
        <AtlasView
          wellenByCategory={wellenByCategory}
          artefakteByCategory={artefakteByCategory}
          alleWellen={alleWellen}
          alleArtefakte={alleArtefakte}
        />
      </div>

      {/* ── Disclaimer ── */}
    </div>
  )
}

// ─── ModuleCard ───────────────────────────────────────────────────────────────

function ModuleCard({ href, title, description, badge, accentColor, icon }: {
  href: string; title: string; description: string
  badge: string; accentColor: string; icon: React.ReactNode
}) {
  return (
    <Link href={href}
      className="group relative flex gap-4 rounded-2xl border px-5 py-4 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl transition-all duration-200 group-hover:w-1"
        style={{ backgroundColor: accentColor }} />

      <div className="mt-0.5 flex-shrink-0 transition-colors duration-200"
        style={{ color: 'var(--text-tertiary)' }}
        >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
          style={{ backgroundColor: accentColor + '18', color: accentColor }}>
          {icon}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-semibold transition-colors duration-200"
            style={{ color: 'var(--text-primary)' }}>
            {title}
          </span>
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
            style={{
              backgroundColor: accentColor + '18',
              color: accentColor,
            }}>
            {badge}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      </div>

      <div className="self-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ color: 'var(--text-tertiary)' }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
        </svg>
      </div>
    </Link>
  )
}

// ─── StatPill ─────────────────────────────────────────────────────────────────

function StatPill({ label, value, sub, color }: {
  label: string; value: number; sub: string; color: 'blue' | 'amber' | 'emerald'
}) {
  const accent = color === 'blue' ? '#2563eb' : color === 'emerald' ? '#059669' : '#d97706'
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2 border text-sm"
      style={{
        backgroundColor: accent + '0f',
        borderColor: accent + '30',
      }}>
      <span className="text-base font-black" style={{ color: accent }}>{value}</span>
      <div>
        <div className="font-semibold text-xs leading-tight" style={{ color: 'var(--text-primary)' }}>{label}</div>
        <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{sub}</div>
      </div>
    </div>
  )
}
