'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CreatorPricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/BIOSTACKR LOGO 2.png" 
                alt="BioStackr" 
                className="h-14 w-auto"
              />
            </Link>
            <Link 
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>⭐</span>
            <span>Creator Plan</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Turn Your Health Expertise Into a Business
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to monetize your health knowledge: affiliate links, custom branding, 
            Shop My Gear page, and follower insights.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly (Save 4 months!)
            </button>
          </div>
        </div>

        {/* Main Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30"></div>
            </div>
            
            <div className="relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center bg-purple-500/20 backdrop-blur-sm border border-purple-300/20 rounded-full px-3 py-1 mb-4">
                  <span className="text-purple-200 text-sm font-medium">Perfect for Creators & Coaches</span>
                </div>
                  <h2 className="text-3xl font-bold flex items-center justify-center space-x-2 mb-4">
                    <span>Creator</span>
                    <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </h2>
                <div className="mb-2">
                  <span className="text-5xl font-bold">
                    ${billingPeriod === 'monthly' ? '29.95' : '199.90'}
                  </span>
                  <span className="text-purple-200 text-xl">
                    /{billingPeriod === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {billingPeriod === 'yearly' && (
                  <div className="inline-flex items-center bg-green-500/20 text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                    Save $159.50 per year
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-8">
                {[
                  'Everything in Pro (unlimited everything)',
                  'Affiliate links & buy buttons on supplements and gear',
                  'Dedicated "Shop My Gear" page',
                  'Custom branding with your logo and colors',
                  'Follower tracking and engagement metrics',
                  'Priority support and creator resources'
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="w-5 h-5 text-purple-300 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-purple-100 leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Primary CTA */}
              <Link
                href="/auth/signup/creator?trial=true"
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 px-6 rounded-lg transition-colors text-lg text-center block mb-4"
              >
                Start 14-Day Creator Trial
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/auth/signup/creator-payment"
                className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg text-center block border border-purple-400/30"
              >
                Go to Payment
              </Link>

              <div className="text-center mt-4 space-y-2">
                <p className="text-sm text-purple-200">
                  No credit card required for trial • Cancel anytime
                </p>
                <p className="text-xs text-purple-300">
                  Trial converts to paid subscription after 14 days • Or choose "Go to Payment" to begin with full access
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Creator Features Matter */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Monetize Your Knowledge</h3>
            <p className="text-gray-600">
              Turn your supplement and gear recommendations into revenue streams with affiliate links and buy buttons.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Your Brand</h3>
            <p className="text-gray-600">
              Custom logo, colors, and professional styling that builds trust and authority with your audience.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Your Following</h3>
            <p className="text-gray-600">
              Make it easy for people to follow your stack with a simple "Follow this stack" button on your profile.
            </p>
          </div>
        </div>


        {/* Creator Confidence Builders */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Why Health Creators Choose BioStackr
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Everything in One Dashboard
              </h3>
              <p className="text-gray-600 text-sm">
                Stop juggling multiple apps. Manage your entire health stack, track followers, and run your creator business from one beautiful interface.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Your Followers Actually Follow
              </h3>
              <p className="text-gray-600 text-sm">
                Simple "Follow this stack" button makes it effortless for people to copy your exact routine. No complex sharing or confusing links.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Professional Without the Complexity
              </h3>
              <p className="text-gray-600 text-sm">
                Look like an established health brand in minutes. Custom branding, clean layouts, and professional presentation—no design skills needed.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Built for Your Exact Use Case
              </h3>
              <p className="text-gray-600 text-sm">
                Designed specifically for supplement recommendations, protocol sharing, and health coaching. Every feature serves your creator needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
