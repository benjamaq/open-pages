'use client'

import Link from 'next/link'
import { useB2cCapacityModal } from '@/app/components/B2cCapacityProvider'

type Props = {
  href: string
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
}

/**
 * Individual B2C CTA: when capacity gate is on, opens waitlist modal instead of navigating.
 */
export function B2cGatedIndividualCta({ href, className, children, style }: Props) {
  const { atCapacity, openWaitlist } = useB2cCapacityModal()

  if (!atCapacity) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={className} style={style} onClick={openWaitlist}>
      {children}
    </button>
  )
}
