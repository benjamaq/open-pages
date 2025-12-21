'use client'

import React, { useState } from 'react'
import Welcome from './Welcome'
import DataUpload from './DataUpload'
import StackEntry from './StackEntry'
import Goals from './Goals'
import InitialInsights from './InitialInsights'

type Step = 'welcome' | 'upload' | 'stack' | 'goals' | 'insights' | 'complete'

export default function BiohackerOnboarding({
  isOpen,
  onComplete,
  userName = 'there'
}: {
  isOpen: boolean
  onComplete: () => void
  userName?: string
}) {
  const [step, setStep] = useState<Step>('welcome')
  const [stack, setStack] = useState<any[]>([])
  const [goals, setGoals] = useState<string[]>([])

  if (!isOpen) return null

  return (
    <>
      {step === 'welcome' && <Welcome isOpen onContinue={() => setStep('upload')} userName={userName} />}
      {step === 'upload' && <DataUpload isOpen onContinue={() => setStep('stack')} />}
      {step === 'stack' && (
        <StackEntry
          isOpen
          onContinue={(s) => {
            setStack(s)
            setStep('goals')
          }}
        />
      )}
      {step === 'goals' && (
        <Goals
          isOpen
          onContinue={(g) => {
            setGoals(g)
            setStep('insights')
          }}
        />
      )}
      {step === 'insights' && (
        <InitialInsights
          isOpen
          onContinue={() => {
            setStep('complete')
            onComplete()
          }}
        />
      )}
    </>
  )
}


