/**
 * UI-Primitiven — die gemeinsame Basis für Karten, Panels, Hinweise und Kennzahlen.
 *
 * WARUM ES DAS GIBT (Befund 2026-08-24): Karten/Hinweisboxen wurden bis dahin auf jeder Seite
 * ad hoc zusammengesetzt (allein `app/intensiv/ncse/page.tsx`: 20 Varianten). Zwei Folgen:
 *   1. Uneinheitliches Spacing/Radius/Border über die App hinweg.
 *   2. Ein ECHTER Bug — die Ad-hoc-Blöcke nutzen hartkodierte Hellfarben (`bg-white`,
 *      `bg-slate-50`, `border-slate-200`) ohne `dark:`-Variante. Im Nachtmodus blieben auf
 *      /intensiv/ncse nachweislich 10 Kacheln weiß mit dunklem Text darauf.
 *
 * Diese Primitiven arbeiten ausschließlich mit den CSS-Tokens aus `app/globals.css`
 * (`--bg-surface`, `--border`, …). Diese sind in `:root` UND `.dark` definiert, wodurch der
 * Nachtmodus automatisch mitkommt — genau das leisten die Tailwind-Farbklassen NICHT.
 *
 * Regel für neuen Code: Karten/Hinweise/Kennzahlen nur noch hierüber bauen. Wer eine neue
 * Variante braucht, erweitert diese Datei, statt daneben eine neue Ad-hoc-Kombination
 * anzulegen (siehe docs/FALLSTRICKE.md).
 */

import type { ReactNode, CSSProperties } from 'react'

// ── Card ──────────────────────────────────────────────────────────────────────
// Der Standard-Container: abgesetzte Fläche auf dem Seitenhintergrund.

type Padding = 'none' | 'sm' | 'md' | 'lg'

const PADDING: Record<Padding, string> = {
  none: '',
  sm:   'px-3 py-2',
  md:   'px-4 py-3',
  lg:   'p-5',
}

// Radius als PROP, nicht per className überschreibbar: Tailwind-Utilities haben untereinander
// dieselbe Spezifität, die Reihenfolge im erzeugten Stylesheet entscheidet — nicht die im
// className-String. `<Card className="rounded-2xl">` blieb deshalb nachweislich bei 12px
// (gemessen 2026-08-24). Siehe docs/FALLSTRICKE.md F-07.
const RADIUS: Record<'md' | 'lg', string> = { md: '12px', lg: '16px' }

interface CardProps {
  children: ReactNode
  padding?: Padding
  /** Dezenter Schatten — für Karten, die sich vom Untergrund abheben sollen. */
  elevated?: boolean
  /** `subtle` = leicht eingetönte Fläche (ersetzt das frühere `bg-slate-50`). */
  tone?: 'surface' | 'subtle'
  /** Eckenradius. NICHT per className setzen (siehe Kommentar oben). */
  radius?: 'md' | 'lg'
  className?: string
  style?: CSSProperties
}

export function Card({
  children, padding = 'lg', elevated = false, tone = 'surface', radius = 'md', className = '', style,
}: CardProps) {
  return (
    <div
      className={`border ${PADDING[padding]} ${className}`}
      style={{
        borderRadius: RADIUS[radius],
        backgroundColor: tone === 'subtle' ? 'var(--bg-subtle)' : 'var(--bg-surface)',
        borderColor: 'var(--border)',
        boxShadow: elevated ? 'var(--shadow-sm)' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────
// Card mit Kopfzeile — für abgegrenzte Abschnitte mit Titel.

interface PanelProps extends Omit<CardProps, 'padding'> {
  title: ReactNode
  /** Rechts in der Kopfzeile, z. B. ein Zähler oder eine Aktion. */
  action?: ReactNode
}

export function Panel({ title, action, children, elevated, tone, radius, className = '', style }: PanelProps) {
  return (
    <Card padding="none" elevated={elevated} tone={tone} radius={radius} className={`overflow-hidden ${className}`} style={style}>
      <div
        className="flex items-center justify-between gap-3 px-4 py-2.5"
        style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}
      >
        <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
          {title}
        </h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  )
}

// ── Callout ───────────────────────────────────────────────────────────────────
// Hinweis-/Warnbox. Die klinischen Bedeutungsfarben bleiben erhalten (rot = pathologisch
// usw.), werden aber je Modus unterschiedlich abgestuft: im Hellmodus zarte Tönung, im
// Nachtmodus dunkle Fläche mit heller Schrift, statt einer weißen Box im dunklen Layout.

export type CalloutTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const TONE_CLASSES: Record<CalloutTone, string> = {
  info:    'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200',
  success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200',
  danger:  'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200',
}

interface CalloutProps {
  children: ReactNode
  tone?: CalloutTone
  title?: ReactNode
  className?: string
}

export function Callout({ children, tone = 'neutral', title, className = '' }: CalloutProps) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${TONE_CLASSES[tone]} ${className}`}>
      {title && <div className="font-semibold mb-0.5">{title}</div>}
      {children}
    </div>
  )
}

// ── Metric ────────────────────────────────────────────────────────────────────
// Einzelne Kennzahl (Wert + Bezeichnung), für Kennzahlenreihen.

interface MetricProps {
  label: ReactNode
  value: ReactNode
  /** Einheit/Zusatz, kleiner und gedämpft hinter dem Wert. */
  unit?: ReactNode
  hint?: ReactNode
  className?: string
}

export function Metric({ label, value, unit, hint, className = '' }: MetricProps) {
  return (
    <div className={className}>
      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-xl font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</span>
        {unit && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{unit}</span>}
      </div>
      {hint && <div className="mt-0.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>{hint}</div>}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
// Leerzustand — gestrichelter Rahmen, damit er sich klar von echtem Inhalt abhebt.

interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-dashed px-5 py-6 text-center ${className}`}
      style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-subtle)' }}
    >
      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</div>
      {description && (
        <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{description}</div>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
