import { createClient } from '../../../lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import SettingsClient from './SettingsClient'
import CacheBuster from '../../../components/CacheBuster'
import type { Metadata } from 'next'
import { isProTrial } from '@/lib/entitlements/pro'

// Add cache-busting metadata for Safari
export const metadata: Metadata = {
  title: 'Settings - BioStackr',
  description: 'Manage your account settings and preferences',
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': `"${Date.now()}"`
  }
}

// Force dynamic rendering for Safari
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SettingsPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/auth/signin')
  }

  // Force fresh data fetch with timestamp
  const timestamp = Date.now()

  // Get user's profile and trial information with cache busting
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // Trial info:
  // - Stripe trials may be tracked in user_usage
  // - Promo/manual trials are tracked via profiles.pro_expires_at
  const { data: usageData } = await supabase
    .from('user_usage')
    .select('is_in_trial, trial_started_at, trial_ended_at, tier')
    .eq('user_id', user.id)
    .maybeSingle()

  const promoTrialActive = isProTrial({ pro_expires_at: (profile as any)?.pro_expires_at ?? null })
  const profileTierLc = String((profile as any)?.tier || '').toLowerCase()
  const tierFromProfile: 'free' | 'pro' | 'creator' =
    profileTierLc === 'creator' ? 'creator' : (profileTierLc === 'pro' ? 'pro' : 'free')

  const trialInfo = {
    isInTrial: Boolean((usageData as any)?.is_in_trial) || promoTrialActive,
    trialStartedAt: (usageData as any)?.trial_started_at ?? null,
    // Prefer user_usage trial end (Stripe); else promo expiry from profiles
    trialEndedAt: (usageData as any)?.trial_ended_at ?? ((profile as any)?.pro_expires_at ?? null),
    // Tier comes from profile (promo trials should not require tier='pro')
    tier: tierFromProfile,
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header - Brand First Design */}
      <div className="bg-white shadow-sm">
        {/* Row 1: Brand Only */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-3 sm:py-4">
            <Link href="/dash" className="inline-flex items-center">
              <img
                src="/BIOSTACKR LOGO 2.png"
                alt="Biostackr"
                className="h-14 w-auto"
              />
              <span className="sr-only">Biostackr dashboard</span>
            </Link>
          </div>
        </div>

        {/* Row 2: Utility Toolbar */}
        <div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-end gap-3 py-2">
              {/* Dashboard Button */}
              <Link 
                href="/dash" 
                className="bg-gray-900 text-white px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors flex items-center gap-1"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SettingsClient profile={profile} userEmail={user.email!} trialInfo={trialInfo} />
        <CacheBuster enabled={false} />
      </div>
    </div>
  )
}
