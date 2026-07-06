'use client'

import { useState, useCallback, useMemo } from 'react'

// Reihenfolge: Morphologie + Dauer VOR Frequenz. Frequenz wird bei sehr kurzer
// Dauer (Spike/Sharp, < 0,5 s) automatisch übersprungen (siehe isStepSkipped).
export const WIZARD_STEPS = [
  { id: 'technik',      label: 'Technik',      short: 'Technik' },
  { id: 'patient',      label: 'Patient',       short: 'Patient' },
  { id: 'phaenomen',    label: 'Phänomen',      short: 'Phänomen' },
  { id: 'lokalisation', label: 'Lokalisation',  short: 'Lokal.' },
  { id: 'morphologie',  label: 'Morphologie',   short: 'Morphol.' },
  { id: 'frequenz',     label: 'Frequenz',      short: 'Frequenz' },
  { id: 'artefakte',    label: 'Artefakte',     short: 'Artefakte' },
  { id: 'ergebnis',     label: 'Ergebnis',      short: 'Ergebnis' },
] as const

export type StepId = (typeof WIZARD_STEPS)[number]['id']

export type StepAnswer = string | string[] | null

export type WizardAnswers = Partial<Record<StepId, StepAnswer>>

// Frequenzbestimmung ist bei sehr kurzer Dauer (Spike < 80 ms, Sharp 80–250 ms)
// nicht sinnvoll → Schritt überspringen. Deckt sich mit dauerKurz im Scoring.
export function isStepSkipped(stepId: StepId, answers: WizardAnswers): boolean {
  if (stepId === 'frequenz') {
    try {
      const m = JSON.parse((answers.morphologie as string) || '{}')
      return m.dauer === 'spike' || m.dauer === 'sharp'
    } catch {
      return false
    }
  }
  return false
}

export interface WizardState {
  currentStep: number
  answers: WizardAnswers
  goNext: () => void
  goBack: () => void
  goToStep: (index: number) => void
  setAnswer: (stepId: StepId, value: StepAnswer) => void
  reset: () => void
  isFirst: boolean
  isLast: boolean
  currentStepId: StepId
  progress: number
  isSkipped: (stepId: StepId) => boolean
}

export function useWizardState(): WizardState {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<WizardAnswers>({})

  const skipped = useCallback(
    (i: number) => isStepSkipped(WIZARD_STEPS[i].id, answers),
    [answers],
  )

  const goNext = useCallback(() => {
    setCurrentStep(s => {
      let n = s + 1
      while (n < WIZARD_STEPS.length - 1 && isStepSkipped(WIZARD_STEPS[n].id, answers)) n++
      return Math.min(n, WIZARD_STEPS.length - 1)
    })
  }, [answers])

  const goBack = useCallback(() => {
    setCurrentStep(s => {
      let n = s - 1
      while (n > 0 && isStepSkipped(WIZARD_STEPS[n].id, answers)) n--
      return Math.max(n, 0)
    })
  }, [answers])

  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= WIZARD_STEPS.length) return
    // Übersprungene Schritte nicht direkt anspringen → auf nächsten sichtbaren umleiten
    let i = index
    while (i < WIZARD_STEPS.length - 1 && isStepSkipped(WIZARD_STEPS[i].id, answers)) i++
    setCurrentStep(i)
  }, [answers])

  const setAnswer = useCallback((stepId: StepId, value: StepAnswer) => {
    setAnswers(prev => ({ ...prev, [stepId]: value }))
  }, [])

  const reset = useCallback(() => {
    setCurrentStep(0)
    setAnswers({})
  }, [])

  // Fortschritt über die tatsächlich sichtbaren (nicht übersprungenen) Schritte
  const { isLast, progress } = useMemo(() => {
    const visible = WIZARD_STEPS.map((_, i) => i).filter(i => !skipped(i))
    const pos = visible.indexOf(currentStep)
    const idxInVisible = pos === -1 ? visible.length - 1 : pos
    return {
      isLast: currentStep === WIZARD_STEPS.length - 1,
      progress: Math.round(((idxInVisible + 1) / visible.length) * 100),
    }
  }, [currentStep, skipped])

  return {
    currentStep,
    answers,
    goNext,
    goBack,
    goToStep,
    setAnswer,
    reset,
    isFirst: currentStep === 0,
    isLast,
    currentStepId: WIZARD_STEPS[currentStep].id,
    progress,
    isSkipped: (stepId: StepId) => isStepSkipped(stepId, answers),
  }
}
