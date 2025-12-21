'use client'
import React from 'react'

export default function OnboardingCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[780px] mx-auto px-6 py-16">
      <div className="rounded-2xl bg-white/95 shadow-sm ring-1 ring-black/[0.05] p-6 sm:p-10">
        {children}
      </div>
    </div>
  )
}


