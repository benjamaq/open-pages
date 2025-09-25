'use client'

import { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Calendar, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Crown, 
  Zap,
  ExternalLink,
  RefreshCw,
  X
} from 'lucide-react'

interface BillingClientProps {
  profile: {
    id: string
    slug: string
    display_name: string
  }
  userEmail: string
}

interface BillingInfo {
  subscription: {
    id: string
    status: 'active' | 'canceled' | 'past_due' | 'trialing'
    plan_name: string
    plan_amount: number
    currency: string
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
    trial_end?: string
  }
  payment_method?: {
    id: string
    type: 'card'
    card: {
      brand: string
      last4: string
      exp_month: number
      exp_year: number
    }
  }
  invoices: Array<{
    id: string
    amount_paid: number
    currency: string
    status: 'paid' | 'open' | 'void'
    created: string
    invoice_pdf?: string
    hosted_invoice_url?: string
  }>
  usage: {
    current_period_start: string
    current_period_end: string
    features: Array<{
      name: string
      limit: number | null
      used: number
      is_unlimited: boolean
    }>
  }
}

export default function BillingClient({ userEmail }: BillingClientProps) {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  // const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false)

  useEffect(() => {
    loadBillingInfo()
  }, [])

  const loadBillingInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/billing/info')
      if (!response.ok) {
        throw new Error('Failed to load billing information')
      }
      
      const data = await response.json()
      setBillingInfo(data)
    } catch (err) {
      console.error('Error loading billing info:', err)
      setError(err instanceof Error ? err.message : 'Failed to load billing information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgradeToProClick = async () => {
    try {
      setIsUpdating(true)
      
      // Use the proper upgrade redirect function
      window.location.href = '/pricing/pro'
    } catch (err) {
      console.error('Error redirecting to upgrade:', err)
      setError('Failed to start upgrade process. Please try again.')
      setIsUpdating(false)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setIsUpdating(true)
      
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      await loadBillingInfo()
      setShowCancelModal(false)
    } catch (err) {
      console.error('Error canceling subscription:', err)
      setError('Failed to cancel subscription. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReactivateSubscription = async () => {
    try {
      setIsUpdating(true)
      
      const response = await fetch('/api/billing/reactivate-subscription', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription')
      }

      await loadBillingInfo()
    } catch (err) {
      console.error('Error reactivating subscription:', err)
      setError('Failed to reactivate subscription. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePaymentMethod = async () => {
    try {
      setIsUpdating(true)
      
      const response = await fetch('/api/billing/create-setup-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success_url: `${window.location.origin}/dash/billing?payment_updated=true`,
          cancel_url: `${window.location.origin}/dash/billing`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create setup session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      console.error('Error creating setup session:', err)
      setError('Failed to start payment method update. Please try again.')
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading billing information...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="font-medium text-red-900">Error Loading Billing Information</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={loadBillingInfo}
              className="mt-3 inline-flex items-center space-x-2 text-sm text-red-700 hover:text-red-900"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription, payment methods, and billing history</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          {billingInfo?.subscription?.plan_name === 'Pro' ? (
            <Crown className="w-6 h-6 text-yellow-500" />
          ) : (
            <Zap className="w-6 h-6 text-green-500" />
          )}
          <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
        </div>

        {billingInfo?.subscription ? (
          <div className="space-y-6">
            {/* Plan Details */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Biostackr {billingInfo.subscription.plan_name}
                  </h3>
                  {billingInfo.subscription.plan_name === 'Pro' && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      PRO
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    billingInfo.subscription.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : billingInfo.subscription.status === 'past_due'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {billingInfo.subscription.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {formatCurrency(billingInfo.subscription.plan_amount, billingInfo.subscription.currency)} per month
                </p>
              </div>
              
              {billingInfo.subscription.plan_name === 'Free' && (
                <button
                  onClick={handleUpgradeToProClick}
                  disabled={isUpdating}
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {isUpdating ? 'Processing...' : 'Upgrade to Pro'}
                </button>
              )}
            </div>

            {/* Billing Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <h4 className="font-medium text-gray-900">Current Billing Period</h4>
                </div>
                <p className="text-sm text-gray-600">
                  {formatDate(billingInfo.subscription.current_period_start)} - {formatDate(billingInfo.subscription.current_period_end)}
                </p>
              </div>

              {billingInfo.subscription.trial_end && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <h4 className="font-medium text-blue-900">Trial Period</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Trial ends {formatDate(billingInfo.subscription.trial_end)}
                  </p>
                </div>
              )}
            </div>

            {/* Cancellation Warning */}
            {billingInfo.subscription.cancel_at_period_end && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Subscription Ending</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your subscription will end on {formatDate(billingInfo.subscription.current_period_end)}. 
                      You'll be moved to the free plan.
                    </p>
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={isUpdating}
                      className="mt-2 text-sm text-yellow-700 hover:text-yellow-900 underline"
                    >
                      Reactivate subscription
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Actions */}
            {billingInfo.subscription.plan_name === 'Pro' && !billingInfo.subscription.cancel_at_period_end && (
              <div className="border-t border-gray-200 pt-6">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Free Plan</h3>
            <p className="text-gray-600 mb-4">You're currently on the free plan</p>
            <button
              onClick={handleUpgradeToProClick}
              disabled={isUpdating}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? 'Processing...' : 'Upgrade to Pro - $9.99/month'}
            </button>
          </div>
        )}
      </div>

      {/* Payment Method */}
      {billingInfo?.payment_method && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-6">
            <CreditCard className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-8 bg-gray-100 rounded border flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 uppercase">
                  {billingInfo.payment_method.card.brand}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  •••• •••• •••• {billingInfo.payment_method.card.last4}
                </p>
                <p className="text-sm text-gray-600">
                  Expires {billingInfo.payment_method.card.exp_month}/{billingInfo.payment_method.card.exp_year}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleUpdatePaymentMethod}
              disabled={isUpdating}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {isUpdating ? 'Processing...' : 'Update'}
            </button>
          </div>
        </div>
      )}

      {/* Usage & Limits */}
      {billingInfo?.usage && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Usage & Limits</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Current period: {formatDate(billingInfo.usage.current_period_start)} - {formatDate(billingInfo.usage.current_period_end)}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {billingInfo.usage.features.map((feature) => (
                <div key={feature.name} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-900 capitalize">{feature.name}</h4>
                    <span className="text-sm font-medium text-gray-600">
                      {feature.used}/{feature.is_unlimited ? '∞' : feature.limit}
                    </span>
                  </div>
                  {!feature.is_unlimited && feature.limit && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-900 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((feature.used / feature.limit) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Billing History */}
      {billingInfo?.invoices && billingInfo.invoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing History</h2>
          
          <div className="space-y-4">
            {billingInfo.invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    invoice.status === 'paid' 
                      ? 'bg-green-500' 
                      : invoice.status === 'open'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(invoice.amount_paid, invoice.currency)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(invoice.created)} • {invoice.status}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {invoice.hosted_invoice_url && (
                    <a
                      href={invoice.hosted_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {invoice.invoice_pdf && (
                    <a
                      href={invoice.invoice_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>PDF</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Subscription</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to cancel your subscription? You'll lose access to Pro features at the end of your current billing period.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelSubscription}
                  disabled={isUpdating}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isUpdating ? 'Canceling...' : 'Yes, Cancel'}
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
