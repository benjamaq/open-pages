'use client'

import { useSearchParams } from 'next/navigation'
import { X, AlertCircle, Clock, RefreshCw } from 'lucide-react'

export default function VerifyFailedPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'unknown'

  const getErrorInfo = (errorCode: string) => {
    switch (errorCode) {
      case 'missing_token':
        return {
          title: 'Invalid Link',
          message: 'The verification link is missing required information.',
          suggestion: 'Please request a new follow link from the profile page.',
          icon: <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
        }
      case 'invalid_token':
        return {
          title: 'Link Not Found',
          message: 'This verification link is invalid or has already been used.',
          suggestion: 'Please request a new follow link from the profile page.',
          icon: <X className="w-16 h-16 mx-auto text-red-500" />
        }
      case 'expired_token':
        return {
          title: 'Link Expired',
          message: 'This verification link has expired for security reasons.',
          suggestion: 'Verification links expire after 7 days. Please request a new one.',
          icon: <Clock className="w-16 h-16 mx-auto text-orange-500" />
        }
      case 'verification_failed':
        return {
          title: 'Verification Failed',
          message: 'We couldn\'t complete the verification process.',
          suggestion: 'Please try again or contact support if the problem persists.',
          icon: <RefreshCw className="w-16 h-16 mx-auto text-red-500" />
        }
      default:
        return {
          title: 'Something Went Wrong',
          message: 'We encountered an unexpected error during verification.',
          suggestion: 'Please try again or contact support if the problem persists.',
          icon: <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
        }
    }
  }

  const errorInfo = getErrorInfo(error)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mb-4">
            {errorInfo.icon}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {errorInfo.title}
          </h1>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <p className="text-gray-600 mb-4">
              {errorInfo.message}
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>What to do next:</strong><br />
                {errorInfo.suggestion}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.history.back()}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
              
              <a
                href="/"
                className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center"
              >
                Browse Stacks
              </a>
            </div>
          </div>

          <div className="mt-8 text-xs text-gray-500">
            <p>
              Need help? Contact <strong>Biostackr</strong> support • 
              <a href="/" className="text-purple-600 hover:text-purple-700">
                Return to homepage
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
