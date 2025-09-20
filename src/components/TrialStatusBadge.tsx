'use client'

import { useState, useEffect } from 'react'
import { Crown, Clock, AlertTriangle } from 'lucide-react'

interface TrialStatus {
  isInTrial: boolean
  daysRemaining: number
  trialStartedAt: string | null
  trialEndedAt: string | null
}

interface TrialStatusBadgeProps {
  userId: string
  currentTier: 'free' | 'pro' | 'creator'
}

export default function TrialStatusBadge({ userId, currentTier }: TrialStatusBadgeProps) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrialStatus()
  }, [userId])

  const fetchTrialStatus = async () => {
    try {
      const response = await fetch('/api/trial-status')
      if (response.ok) {
        const data = await response.json()
        setTrialStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch trial status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  // Don't show trial badge for Pro/Creator users
  if (currentTier !== 'free') {
    return null
  }

  // Don't show if not in trial
  if (!trialStatus?.isInTrial) {
    return null
  }

  const daysRemaining = trialStatus.daysRemaining
  const isExpiringSoon = daysRemaining <= 3

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
      isExpiringSoon 
        ? 'bg-orange-100 text-orange-800 border border-orange-200' 
        : 'bg-blue-100 text-blue-800 border border-blue-200'
    }`}>
      {isExpiringSoon ? (
        <AlertTriangle className="w-4 h-4" />
      ) : (
        <Crown className="w-4 h-4" />
      )}
      
      {daysRemaining > 0 ? (
        <span>
          {daysRemaining === 1 ? '1 day' : `${daysRemaining} days`} left in Pro trial
        </span>
      ) : (
        <span>Pro trial expired</span>
      )}
      
      <Clock className="w-3 h-3 opacity-70" />
    </div>
  )
}
