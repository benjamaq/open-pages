'use client'

import { useSearchParams } from 'next/navigation'
import { Check, Heart, Settings } from 'lucide-react'

export default function VerifySuccessPage() {
  const searchParams = useSearchParams()
  const ownerName = searchParams.get('owner') || 'this user'
  const ownerSlug = searchParams.get('slug')
  const followId = searchParams.get('followId')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-green-600 text-6xl mb-4">
            <Check className="w-16 h-16 mx-auto" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            You're Following!
          </h1>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Heart className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Following {ownerName}'s stack</span>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Weekly email digests enabled</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Only public items included</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Unsubscribe anytime</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              You'll receive weekly email updates when {ownerName} changes their public supplements, protocols, and routines.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {ownerSlug && (
                <a
                  href={`/u/${ownerSlug}`}
                  className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center"
                >
                  View {ownerName}'s Stack
                </a>
              )}
              
              {followId && (
                <a
                  href={`/manage-follow?id=${followId}`}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center inline-flex items-center justify-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Manage Emails</span>
                </a>
              )}
            </div>
          </div>

          <div className="mt-8 text-xs text-gray-500">
            <p>
              Powered by <strong>Biostackr</strong> • 
              <a href="/" className="text-purple-600 hover:text-purple-700">
                Create your own stack
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
