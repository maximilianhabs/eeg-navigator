'use client'

import { useState, useCallback } from 'react'

export const WIZARD_STEPS = [
  { id: 'technik',      label: 'Technik',      short: 'Technik' },
  { id: 'patient',      label: 'Patient',       short: 'Patient' },
  { id: 'phaenomen',    label: 'Phänomen',      short: 'Phänomen' },
  { id: 'frequenz',     label: 'Frequenz',      short: 'Frequenz' },
  { id: 'lokalisation', label: 'Lokalisation',  short: 'Lokal.' },
  { id: 'morphologie',  label: 'Morphologie',   short: 'Morphol.' },
  { id: 'artefakte',    label: 'Artefakte',     short: 'Artefakte' },
  { id: 'ergebnis',     label: 'Ergebnis',      short: 'Ergebnis' },
] as const

export type StepId = (typeof WIZARD_STEPS)[number]['id']

export type StepAnswer = string | string[] | null

export type WizardAnswers = Partial<Record<StepId, StepAnswer>>

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
}

export function useWizardState(): WizardState {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<WizardAnswers>({})

  const goNext = useCallback(() => {
    setCurrentStep(s => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }, [])

  const goBack = useCallback(() => {
    setCurrentStep(s => Math.max(s - 1, 0))
  }, [])

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < WIZARD_STEPS.length) {
      setCurrentStep(index)
    }
  }, [])

  const setAnswer = useCallback((stepId: StepId, value: StepAnswer) => {
    setAnswers(prev => ({ ...prev, [stepId]: value }))
  }, [])

  const reset = useCallback(() => {
    setCurrentStep(0)
    setAnswers({})
  }, [])

  return {
    currentStep,
    answers,
    goNext,
    goBack,
    goToStep,
    setAnswer,
    reset,
    isFirst: currentStep === 0,
    isLast: currentStep === WIZARD_STEPS.length - 1,
    currentStepId: WIZARD_STEPS[currentStep].id,
    progress: Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100),
  }
}
