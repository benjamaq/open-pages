'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function UpgradeSuccessPage() {
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Simulate loading time for the webhook to process
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <h1 className="text-xl font-medium text-gray-900 mb-2">Processing your upgrade...</h1>
          <p className="text-gray-600">This will just take a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/dash" className="flex items-center space-x-2">
              <img 
                src="/BIOSTACKR LOGO 2.png" 
                alt="BioStackr" 
                className="h-14 w-auto"
              />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to BioStackr Pro! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your upgrade was successful. You now have access to unlimited supplements, protocols, 
            movement, mindfulness, gear, and files.
          </p>

          {/* What's Next */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What's next?</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0">✓</span>
                <span className="text-gray-700">Start adding unlimited items to your stack</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0">✓</span>
                <span className="text-gray-700">Upload as many files as you need to your Library</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0">✓</span>
                <span className="text-gray-700">Your Current Plan will be featured on your public profile</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0">✓</span>
                <span className="text-gray-700">Access priority support when you need help</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dash"
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/dash/settings"
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Manage Subscription
            </Link>
          </div>

          {/* Receipt Info */}
          <div className="mt-8 text-sm text-gray-500">
            <p>A receipt has been sent to your email address.</p>
            {sessionId && (
              <p className="mt-1">Session ID: {sessionId}</p>
            )}
          </div>

          {/* Support */}
          <div className="mt-12 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Need help getting started?</h3>
            <p className="text-blue-800 text-sm mb-3">
              Check out our quick start guide or reach out to our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href="/help"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View Quick Start Guide →
              </Link>
              <Link
                href="/support"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
