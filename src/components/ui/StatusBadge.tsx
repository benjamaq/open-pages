import React from 'react'
import { CockpitTokens, StatusColors } from '@/lib/colors'

type Variant = 'proven' | 'testing' | 'confounded' | 'collecting'
type TierStatus = 'TRIAL' | 'GATHERING_EVIDENCE' | 'RULE' | 'CONFOUNDED' | 'HURTING'

export default function StatusBadge({
  variant,
  status,
  label,
  icon,
  title,
  children
}: {
  variant?: Variant
  status?: TierStatus
  label?: string
  icon?: string
  title?: string
  children?: React.ReactNode
}) {
  // base token mapping
  let token: any = CockpitTokens.gather
  if (status === 'TRIAL') token = CockpitTokens.trial
  if (status === 'RULE') token = CockpitTokens.rule
  if (status === 'CONFOUNDED') token = CockpitTokens.confound
  if (status === 'HURTING') token = CockpitTokens.hurting
  const c = { text: (token.chip.split(' ')[1]?.replace('text-','') ? undefined : undefined) }
  const text = label ?? children
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${token.chip} ${token.border}`}
      title={title}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: token.dot }} />
      {icon ? <span className="mr-0.5">{icon}</span> : null}
      <span>{text}</span>
    </span>
  )
}


