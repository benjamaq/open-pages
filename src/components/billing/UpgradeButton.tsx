'use client'

import { useState } from 'react'
import PaywallModal from './PaywallModal'

export default function UpgradeButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={compact
          ? 'px-3 h-8 rounded-lg border border-gray-300 text-sm text-gray-800 hover:bg-gray-50'
          : 'px-3 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50'}
      >
        Upgrade
      </button>
      <PaywallModal open={open} onClose={() => setOpen(false)} defaultPeriod="yearly" />
    </>
  )
}


