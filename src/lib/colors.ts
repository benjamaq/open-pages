import type { InsightStatus } from './signals'

export const Tokens = {
  ring: {
    insufficient: '#9CA3AF', // gray-400
    testing:      '#F59E0B', // amber-500
    confirmed:    '#10B981', // emerald-500
    hurting:      '#EF4444', // red-500
    no_effect:    '#6B7280', // gray-500
  },
  text: {
    subtle: '#6B7280',
    strong: '#111827'
  },
  chip: {
    bg: '#F3F4F6',
    border: '#E5E7EB'
  },
} as const;

// Cockpit single source of truth for 3-tier tokens
export const CockpitTokens = {
  trial:     { ring:'from-purple-500 to-purple-300',  border:'border-purple-300',  dot:'#8B5CF6', chip:'bg-purple-50 text-purple-700' },
  gather:    { ring:'from-blue-500   to-blue-300',    border:'border-blue-300',    dot:'#3B82F6', chip:'bg-blue-50 text-blue-700' },
  rule:      { ring:'from-emerald-500 to-emerald-300',border:'border-emerald-300', dot:'#10B981', chip:'bg-emerald-50 text-emerald-700' },
  confound:  { ring:'from-amber-400 to-gray-300',     border:'border-amber-300',   dot:'#F59E0B', chip:'bg-amber-50 text-amber-800' },
  hurting:   { ring:'from-rose-500 to-rose-300',      border:'border-rose-300',    dot:'#EF4444', chip:'bg-rose-50 text-rose-700' },
} as const

export function statusColor(status: InsightStatus): string {
  switch (status) {
    case 'insufficient': return Tokens.ring.insufficient
    case 'testing':      return Tokens.ring.testing
    case 'confirmed':    return Tokens.ring.confirmed
    case 'hurting':      return Tokens.ring.hurting
    case 'no_effect':    return Tokens.ring.no_effect
  }
}

// Premium UI semantic status colors (UX spec)
export const StatusColors = {
  proven:     { text: '#047857', bg: '#D1FAE5', border: '#A7F3D0' },   // emerald
  testing:    { text: '#6D28D9', bg: '#EDE9FE', border: '#DDD6FE' },   // purple
  confounded: { text: '#92400E', bg: '#FEF3C7', border: '#FDE68A' },   // amber
  collecting: { text: '#374151', bg: '#F3F4F6', border: '#E5E7EB' },   // gray
  // 3-Tier system (Final Build Brief)
  TRIAL: {
    ring: 'from-purple-500 to-pink-500',
    border: 'border-purple-400',
    bg: 'bg-purple-50',
    text: 'text-purple-700'
  },
  GATHERING_EVIDENCE: {
    ring: 'from-blue-500 to-blue-300',
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    text: 'text-blue-700'
  },
  RULE: {
    ring: 'from-green-500 to-green-300',
    border: 'border-green-400',
    bg: 'bg-green-50',
    text: 'text-green-700'
  },
  CONFOUNDED: {
    ring: 'from-amber-400 to-gray-300',
    border: 'border-amber-300',
    bg: 'bg-amber-50',
    text: 'text-amber-700'
  },
  HURTING: {
    ring: 'from-amber-500 to-red-400',
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    text: 'text-amber-700'
  }
} as const


