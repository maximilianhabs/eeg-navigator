import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import BottomNav from '@/components/BottomNav'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EEG Navigator',
  description: 'Regelbasiertes EEG-Lehr- und Entscheidungssystem',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          {/* ── Topbar ── */}
          <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">

              {/* Logo */}
              <a href="/" className="group flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 shadow-sm group-hover:bg-blue-700 transition-colors">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2l2-6 2 12 2-8 2 4 2-2h4"/>
                  </svg>
                </div>
                <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  EEG Navigator
                </span>
                <span className="hidden sm:inline-block rounded bg-blue-600/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  α
                </span>
              </a>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {[
                  { href: '/',          label: 'Atlas' },
                  { href: '/eeg-viewer',label: 'EEG-Viewer' },
                  { href: '/schlaf',    label: 'Schlaf' },
                  { href: '/intensiv',  label: 'Intensiv' },
                  { href: '/wizard',    label: 'Wizard' },
                ].map(({ href, label }) => (
                  <a key={href} href={href}
                    className="rounded-md px-3 py-1.5 font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                    {label}
                  </a>
                ))}
                <a href="/teaching"
                  className="ml-1 rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-800/60">
                  Teaching
                </a>
              </nav>

              {/* Right side */}
              <div className="flex items-center gap-1">
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* ── Content ── */}
          <main className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8 pb-24 md:pb-8 flex-1 animate-fade-in">
            {children}
          </main>

          {/* ── Footer ── */}
          <footer className="hidden md:block border-t mt-16" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}>
            <div className="mx-auto max-w-6xl px-4 py-5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              EEG Navigator — Didaktisches Lern- und Entscheidungssystem.{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>Kein Medizinprodukt.</strong>{' '}
              Nicht zur klinischen Anwendung geeignet.
            </div>
          </footer>

          {/* ── Mobile Bottom Tab Bar ── */}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
