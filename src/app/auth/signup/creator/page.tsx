'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreatorSignUpPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main signup page after a short delay
    const timer = setTimeout(() => {
      router.push('/auth/signup')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

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
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Creator Signup Coming Soon
          </h1>
          
          <p className="text-gray-600 mb-6">
            We're working on creator-specific signup flows. For now, you can sign up for our Free or Pro tiers 
            and we'll notify you when creator features are available.
          </p>
          
          <div className="space-y-3">
            <Link 
              href="/auth/signup"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
            >
              Sign Up for Free
            </Link>
            
            <Link 
              href="/pricing/pro"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors text-center block"
            >
              View Pro Pricing
            </Link>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Redirecting to signup page in 3 seconds...
          </p>
        </div>
      </div>
    </div>
  )
}