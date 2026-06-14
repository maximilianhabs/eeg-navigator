'use client'

import { WIZARD_STEPS } from '@/hooks/useWizardState'

interface Props {
  currentStep: number
  onStepClick?: (index: number) => void
  answers: Record<string, unknown>
}

export default function WizardStepIndicator({ currentStep, onStepClick, answers }: Props) {
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100
  const answeredCount = WIZARD_STEPS.filter(s => answers[s.id] != null).length

  return (
    <div className="w-full">

      {/* ── Desktop: Schritt-Kreise + Verbindungslinien ── */}
      <div className="hidden md:flex items-center justify-between">
        {WIZARD_STEPS.map((step, i) => {
          const done   = i < currentStep
          const active = i === currentStep
          const future = i > currentStep

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => done && onStepClick?.(i)}
                disabled={future}
                className="flex flex-col items-center gap-1.5 group focus:outline-none"
              >
                {/* Circle */}
                <div className={`
                  relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${active ? 'scale-110' : 'scale-100'}
                `}
                  style={{
                    backgroundColor: active
                      ? 'var(--brand)'
                      : done
                        ? 'rgba(37,99,235,0.15)'
                        : 'var(--bg-subtle)',
                    color: active
                      ? '#fff'
                      : done
                        ? 'var(--brand)'
                        : 'var(--text-tertiary)',
                    boxShadow: active ? '0 0 0 3px rgba(37,99,235,0.2)' : 'none',
                  }}>
                  {done ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                  {/* Active pulse ring */}
                  {active && (
                    <span className="absolute inset-0 rounded-full animate-ping opacity-20"
                      style={{ backgroundColor: 'var(--brand)' }} />
                  )}
                </div>

                {/* Label */}
                <span className="text-[11px] font-semibold whitespace-nowrap transition-colors duration-200"
                  style={{
                    color: active ? 'var(--brand)' : done ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                  }}>
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {i < WIZARD_STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mt-[-18px] overflow-hidden rounded-full"
                  style={{ backgroundColor: 'var(--bg-muted)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: 'var(--brand)',
                      width: done ? '100%' : active ? '50%' : '0%',
                      opacity: done ? 1 : 0.4,
                    }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Mobile: Kompakter Fortschritts-Header ── */}
      <div className="md:hidden space-y-3">

        {/* Top row: Schritt-Info + answered count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--brand)' }}>
              {currentStep + 1}
            </span>
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {WIZARD_STEPS[currentStep].label}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                Schritt {currentStep + 1} von {WIZARD_STEPS.length}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold" style={{ color: 'var(--brand)' }}>
              {Math.round(progress)}%
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {answeredCount} beantwortet
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, #2563eb, #7c3aed)`,
            }}
          />
        </div>

        {/* Mini step dots */}
        <div className="flex gap-1 justify-center">
          {WIZARD_STEPS.map((step, i) => {
            const done   = i < currentStep
            const active = i === currentStep
            const ans    = answers[step.id] != null
            return (
              <button
                key={step.id}
                onClick={() => (done || active) && onStepClick?.(i)}
                disabled={i > currentStep}
                title={step.label}
                className="transition-all duration-200 rounded-full"
                style={{
                  width: active ? '20px' : '6px',
                  height: '6px',
                  backgroundColor: active
                    ? 'var(--brand)'
                    : done || ans
                      ? 'rgba(37,99,235,0.5)'
                      : 'var(--bg-muted)',
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
