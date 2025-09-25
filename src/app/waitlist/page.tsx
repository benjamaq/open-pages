'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Clock, Users, CheckCircle } from 'lucide-react'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const result = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        setMessage('Successfully joined the waitlist! We\'ll notify you when beta codes are available.')
        setEmail('')
      } else {
        setIsSuccess(false)
        setMessage(result.error || 'Failed to join waitlist. Please try again.')
      }
    } catch (error) {
      setIsSuccess(false)
      setMessage('Failed to join waitlist. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="inline-flex items-center">
              <img
                src="/BIOSTACKR LOGO 2.png"
                alt="Biostackr"
                className="h-12 w-auto"
              />
            </Link>
            <Link 
              href="/auth/signup" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Have a Beta Code? Sign Up Here
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Beta Badge - Positioned below header, left side */}
          <div className="mb-8 flex justify-center">
            <div className="bg-black text-white rounded-full w-24 h-24 flex items-center justify-center text-2xl font-bold">
              BETA
            </div>
          </div>
          
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <Clock className="w-4 h-4 mr-2" />
            Beta Launch Coming Soon
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Join the BioStackr Beta
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Be among the first to build and share your health stack. Get 6 months of Pro access for free during our beta period.
          </p>


          {/* Waitlist Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Get Early Access
            </h2>
            <p className="text-gray-600 mb-6">
              Enter your email to join the waitlist and get notified when beta codes are available.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                isSuccess 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-4">
              We'll only email you about beta access. No spam.
            </p>
          </div>

          {/* Beta Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Build Your Stack
              </h3>
              <p className="text-gray-600">
                Track supplements, protocols, movement, and more in one place.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Share & Follow
              </h3>
              <p className="text-gray-600">
                Share your stack publicly and follow others' health journeys.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Get Updates
              </h3>
              <p className="text-gray-600">
                Receive updates when people you follow change their stacks.
              </p>
            </div>
          </div>

          {/* Beta Timeline */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Beta Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Beta System Ready</p>
                  <p className="text-sm text-gray-600">50 beta codes generated and ready</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Reddit Launch</p>
                  <p className="text-sm text-gray-600">Beta codes distributed on r/Biohackers</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Public Launch</p>
                  <p className="text-sm text-gray-600">Open registration after beta period</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              © 2024 BioStackr. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
