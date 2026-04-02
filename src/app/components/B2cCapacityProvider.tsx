'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { B2cCapacityWaitlistPanel } from '@/app/components/B2cCapacityWaitlistPanel'

type Ctx = {
  atCapacity: boolean
  openWaitlist: () => void
}

const B2cCapacityContext = createContext<Ctx | null>(null)

export function useB2cCapacityModal(): Ctx {
  const v = useContext(B2cCapacityContext)
  if (!v) {
    throw new Error('useB2cCapacityModal must be used within B2cCapacityProvider')
  }
  return v
}

export function B2cCapacityProvider({
  children,
  /** Set from root layout (server) so `B2C_AT_CAPACITY` works without NEXT_PUBLIC_. */
  atCapacity: atCapacityProp,
}: {
  children: React.ReactNode
  atCapacity: boolean
}) {
  const [open, setOpen] = useState(false)

  const openWaitlist = useCallback(() => {
    if (atCapacityProp) setOpen(true)
  }, [atCapacityProp])
  const close = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({ atCapacity: atCapacityProp, openWaitlist }),
    [atCapacityProp, openWaitlist],
  )

  return (
    <B2cCapacityContext.Provider value={value}>
      {children}
      {atCapacityProp && open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="b2c-capacity-heading"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <B2cCapacityWaitlistPanel variant="modal" onRequestClose={close} showNavLinks={false} />
          </div>
        </div>
      ) : null}
    </B2cCapacityContext.Provider>
  )
}
