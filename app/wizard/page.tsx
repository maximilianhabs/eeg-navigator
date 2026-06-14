'use client'

import { useWizardState, WIZARD_STEPS } from '@/hooks/useWizardState'
import WizardStepIndicator from '@/components/WizardStepIndicator'
import StepTechnik from '@/components/wizard/StepTechnik'
import StepPatient from '@/components/wizard/StepPatient'
import StepPhaenomen from '@/components/wizard/StepPhaenomen'
import StepFrequenz from '@/components/wizard/StepFrequenz'
import StepLokalisation from '@/components/wizard/StepLokalisation'
import StepMorphologie from '@/components/wizard/StepMorphologie'
import StepArtefakte from '@/components/wizard/StepArtefakte'
import StepErgebnis from '@/components/wizard/StepErgebnis'

function NotApplicableButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200"
      style={active ? {
        borderColor: 'var(--border-strong)',
        backgroundColor: 'var(--bg-subtle)',
        color: 'var(--text-secondary)',
      } : {
        borderColor: 'var(--border)',
        color: 'var(--text-tertiary)',
      }}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
      Nicht beurteilbar
    </button>
  )
}

function PlaceholderStep({ stepId, label }: { stepId: string; label: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
      <div className="text-3xl mb-3">🚧</div>
      <p className="text-sm font-medium text-slate-500">Phase <span className="font-semibold text-slate-700">{label}</span> — wird in einem späteren Chunk implementiert</p>
      <p className="text-xs text-slate-400 mt-1">({stepId})</p>
    </div>
  )
}

function StepContent({ stepId, value, onChange, answers }: {
  stepId: string
  value: import('@/hooks/useWizardState').StepAnswer
  onChange: (v: import('@/hooks/useWizardState').StepAnswer) => void
  answers: import('@/hooks/useWizardState').WizardAnswers
}) {
  const technikAnswer = answers.technik as string | undefined
  switch (stepId) {
    case 'technik':
      return <StepTechnik value={value} onChange={onChange} />
    case 'patient':
      return <StepPatient value={value} onChange={onChange} />
    case 'phaenomen':
      return <StepPhaenomen value={value} onChange={onChange} />
    case 'frequenz':
      return (
        <StepFrequenz
          value={value}
          onChange={onChange}
          morphologieAnswer={answers.morphologie as string | undefined}
        />
      )
    case 'lokalisation':
      return <StepLokalisation value={value} onChange={onChange} technikAnswer={technikAnswer} />
    case 'morphologie':
      return <StepMorphologie value={value} onChange={onChange} technikAnswer={technikAnswer} />
    case 'artefakte':
      return (
        <StepArtefakte
          value={value}
          onChange={onChange}
          patientAnswer={answers.patient as string | undefined}
          lokalisationAnswer={answers.lokalisation as string | undefined}
          morphologieAnswer={answers.morphologie as string | undefined}
        />
      )
    case 'ergebnis':
      return (
        <StepErgebnis
          value={value}
          onChange={onChange}
          technikAnswer={answers.technik as string | undefined}
          patientAnswer={answers.patient as string | undefined}
          phaenomenAnswer={answers.phaenomen as string | undefined}
          frequenzAnswer={answers.frequenz as string | undefined}
          lokalisationAnswer={answers.lokalisation as string | undefined}
          morphologieAnswer={answers.morphologie as string | undefined}
        />
      )
    default:
      return <PlaceholderStep stepId={stepId} label={stepId} />
  }
}

export default function WizardPage() {
  const wizard = useWizardState()
  const step = WIZARD_STEPS[wizard.currentStep]
  const isNB = wizard.answers[wizard.currentStepId] === '__nb'

  function handleNB() {
    wizard.setAnswer(wizard.currentStepId, isNB ? null : '__nb')
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>EEG-Wizard</h1>
          <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Beta</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Geführte EEG-Klassifikation — Schritt für Schritt</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <WizardStepIndicator
          currentStep={wizard.currentStep}
          onStepClick={wizard.goToStep}
          answers={wizard.answers as Record<string, unknown>}
        />
      </div>

      {/* Step Content */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{step.label}</h2>
          <NotApplicableButton onClick={handleNB} active={isNB} />
        </div>

        {isNB ? (
          <div className="rounded-2xl border p-6 text-sm text-center"
            style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Als <strong>nicht beurteilbar</strong> markiert — dieser Schritt wird übersprungen.
          </div>
        ) : (
          <StepContent
            stepId={step.id}
            value={wizard.answers[wizard.currentStepId] ?? null}
            onChange={v => wizard.setAnswer(wizard.currentStepId, v)}
            answers={wizard.answers}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-5">
        <button
          onClick={wizard.goBack}
          disabled={wizard.isFirst}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Zurück
        </button>

        <button
          onClick={wizard.reset}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Neu starten
        </button>

        {wizard.isLast ? (
          <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Ergebnis
          </span>
        ) : (
          <button
            onClick={wizard.goNext}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Weiter
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
