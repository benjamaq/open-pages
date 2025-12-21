'use client'

import React from 'react'
import SupplementCard from './SupplementCard'

export default function GatheringEvidencePanel({
  supplements
}: {
  supplements: any[]
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {supplements.map((s) => (
          <div key={s.id} className="animate-breathe">
            <SupplementCard supplement={s} />
          </div>
        ))}
      </div>
    </section>
  )
}


