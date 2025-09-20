'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Crown, Plus, X } from 'lucide-react'

interface UsageData {
  stackItems: number
  protocols: number
  uploads: number
  stackItemsLimit: number
  protocolsLimit: number
  uploadsLimit: number
}

interface LimitCheckerProps {
  userId: string
  currentTier: 'free' | 'pro' | 'creator'
}

export default function LimitChecker({ userId, currentTier }: LimitCheckerProps) {
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has dismissed limit warnings
    const dismissedKey = `limit-warning-dismissed-${userId}`
    const isDismissed = localStorage.getItem(dismissedKey) === 'true'
    setDismissed(isDismissed)

    fetchUsageData()
  }, [userId])

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/usage-status')
      if (response.ok) {
        const data = await response.json()
        setUsageData(data)
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = () => {
    window.location.href = '/pricing'
  }

  const handleDismiss = () => {
    const dismissedKey = `limit-warning-dismissed-${userId}`
    localStorage.setItem(dismissedKey, 'true')
    setDismissed(true)
  }

  if (loading || !usageData || currentTier !== 'free' || dismissed) {
    return null
  }

  // Check if user is approaching limits (80% or more)
  const stackItemsNearLimit = usageData.stackItems >= (usageData.stackItemsLimit * 0.8)
  const protocolsNearLimit = usageData.protocols >= (usageData.protocolsLimit * 0.8)
  const uploadsNearLimit = usageData.uploads >= (usageData.uploadsLimit * 0.8)

  const isNearAnyLimit = stackItemsNearLimit || protocolsNearLimit || uploadsNearLimit

  if (!isNearAnyLimit) {
    return null
  }

  const getLimitMessage = () => {
    const limits = []
    if (stackItemsNearLimit) {
      limits.push(`${usageData.stackItems}/${usageData.stackItemsLimit} supplements`)
    }
    if (protocolsNearLimit) {
      limits.push(`${usageData.protocols}/${usageData.protocolsLimit} protocols`)
    }
    if (uploadsNearLimit) {
      limits.push(`${usageData.uploads}/${usageData.uploadsLimit} files`)
    }
    
    return `You're using ${limits.join(', ')}`
  }

  const getDetailedMessage = () => {
    const messages = []
    if (stackItemsNearLimit) {
      messages.push(`${usageData.stackItems}/${usageData.stackItemsLimit} supplements`)
    }
    if (protocolsNearLimit) {
      messages.push(`${usageData.protocols}/${usageData.protocolsLimit} protocols`)
    }
    if (uploadsNearLimit) {
      messages.push(`${usageData.uploads}/${usageData.uploadsLimit} files`)
    }
    
    return `You're using ${messages.join(', ')}. Your existing items will remain safe, but you won't be able to add more until you upgrade.`
  }

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">
              Approaching free tier limits
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              {getDetailedMessage()} Upgrade to Pro for unlimited everything!
            </p>
            <button
              onClick={handleUpgrade}
              className="inline-flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-yellow-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-yellow-600" />
        </button>
      </div>
    </div>
  )
}
