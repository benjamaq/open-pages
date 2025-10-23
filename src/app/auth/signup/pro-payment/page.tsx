'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../../lib/supabase/client'

function ProPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const billingPeriod = searchParams.get('billing') as 'monthly' | 'yearly' || 'monthly'

  useEffect(() => {
    // Automatically redirect to Stripe checkout when the page loads
    handleUpgrade()
  }, [])

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Client - Making request to create checkout session')
      
      // Get current user info
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to upgrade')
        setLoading(false)
        return
      }
      
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for Safari
        body: JSON.stringify({
          plan: 'pro',
          period: billingPeriod,
          userId: user.id,
          userEmail: user.email,
        }),
      })

      console.log('Client - Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Client - Error response:', errorData)
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      console.log('Client - Got checkout URL:', url)
      window.location.href = url
    } catch (error) {
      console.error('Checkout session error:', error)
      setError(error instanceof Error ? error.message : 'Failed to redirect to payment. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="mb-8">
          <img 
            src="/BIOSTACKR LOGO 2.png" 
            alt="BioStackr" 
            className="h-16 w-auto mx-auto mb-6"
          />
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Upgrading to Premium
          </h1>
          
          <p className="text-gray-600 mb-6">
            Redirecting you to secure payment processing...
          </p>
          
          {loading && (
            <div className="flex items-center justify-center mb-6">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-sm text-gray-600">Loading payment...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6">
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
            </button>
            
            <Link 
              href="/pricing"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors text-center block"
            >
              Cancel
            </Link>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ProPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="mb-8">
            <img 
              src="/BIOSTACKR LOGO 2.png" 
              alt="BioStackr" 
              className="h-16 w-auto mx-auto mb-6"
            />
          </div>
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment...</p>
          </div>
        </div>
      </div>
    }>
      <ProPaymentContent />
    </Suspense>
  )
}
