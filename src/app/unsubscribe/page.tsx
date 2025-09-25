'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { updateNotificationPreferences } from '../../lib/actions/notifications'

function UnsubscribeContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    handleUnsubscribe()
  }, [token])

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid unsubscribe link')
      return
    }

    try {
      // Disable email notifications
      await updateNotificationPreferences({
        email_enabled: false,
        daily_reminder_enabled: false
      })

      setStatus('success')
      setMessage('You have been successfully unsubscribed from email notifications.')
    } catch (error) {
      console.error('Unsubscribe error:', error)
      setStatus('error')
      setMessage('Failed to unsubscribe. Please try again or contact support.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Biostackr Notifications
          </h1>
          
          {status === 'loading' && (
            <div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your request...</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Unsubscribed Successfully
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  You can re-enable notifications anytime by visiting your settings.
                </p>
                <a
                  href="/dash/settings"
                  className="inline-block bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Go to Settings
                </a>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="text-red-600 text-5xl mb-4">✗</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Unsubscribe Failed
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-4">
                <a
                  href="/dash/settings"
                  className="inline-block bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Manage Notifications
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Biostackr Notifications
            </h1>
            <div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
