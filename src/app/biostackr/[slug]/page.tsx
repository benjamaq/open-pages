import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import { FileText, Image as ImageIcon, File, Edit2 } from 'lucide-react'
import { headers } from 'next/headers'
import ShareButton from '../../../components/ShareButton'
import SupplementsSection from '../../../components/SupplementsSection'
import JournalSection from '../../../components/JournalSection'
import PublicProfileClientWrapper from '../../../components/PublicProfileClientWrapper'
import StickyNavigation from '../../../components/StickyNavigation'
import PublicProfileHeader from '../../../components/PublicProfileHeader'
import PublicProfileWithFollow from '../../../components/PublicProfileWithFollow'
import ProfileActionButtons from '../../../components/ProfileActionButtons'
import FollowButton from '../../../components/FollowButton'
import { getPublicLibraryItems } from '../../../lib/actions/library'
import type { Metadata } from 'next'

interface ProfilePageProps {
  params: Promise<{
    slug: string
  }>
}

// Generate metadata for social sharing
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, avatar_url, public')
    .eq('slug', slug)
    .single()

  if (!profile || !(profile as any).public) {
    return {
      title: 'Profile Not Found',
      description: 'This profile is not available or does not exist.'
    }
  }

  const profileData = profile as any
  const title = `${profileData.display_name}'s Health Stack`
  const description = profileData.bio || `Check out ${profileData.display_name}'s health and wellness journey, including their supplement stack, protocols, and daily routines.`
  const image = profileData.avatar_url || '/og-default.png'
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/biostackr/${slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'BioStackr',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function ProfilePage({ params, searchParams }: { 
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const search = await searchParams
  const supabase = await createClient()
  

  // Check if user is authenticated and get their profile
  // Use a fresh supabase client to avoid cached sessions
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  let currentUserProfile: { slug: string } | null = null
  
  // Only proceed if we have a valid user and no error
  if (user && !userError) {
    try {
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('slug')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      // Only set if we successfully got the profile (use most recent)
      if (!profileError && userProfiles && userProfiles.length > 0) {
        currentUserProfile = userProfiles[0] as { slug: string }
      }
    } catch (err) {
      console.log('Profile fetch error:', err)
      currentUserProfile = null
    }
  }

  // Check if this is the user's own profile
  const isOwnProfile = currentUserProfile?.slug === slug

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // Check if profile is public or if user owns it
  if (!(profile as any).public && !isOwnProfile) {
    notFound()
  }

  // Get public modules configuration from public_modules JSON field
  const publicModulesData = (profile as any).public_modules || {}
  const publicModules = {
    supplements: publicModulesData.supplements ?? true,
    protocols: publicModulesData.protocols ?? true,
    movement: publicModulesData.movement ?? true,
    mindfulness: publicModulesData.mindfulness ?? true,
    gear: publicModulesData.gear ?? true,
    uploads: publicModulesData.uploads ?? true,
    library: publicModulesData.library ?? true,
    journal: publicModulesData.journal ?? true,
    mood: publicModulesData.mood ?? true
  }
  
  console.log('Profile public module settings:', {
    publicModulesData,
    publicModulesMood: publicModules.mood,
    profileId: (profile as any).id
  })

  // Fetch public data for each module
  let publicSupplements: any[] = []
  let publicProtocols: any[] = []
  let publicMovement: any[] = []
  let publicMindfulness: any[] = []
  let publicGear: any[] = []
  let publicUploads: any[] = []
  let publicJournalEntries: any[] = []
  let publicMoodData: any[] = []

  // Fetch supplements
  if (publicModules.supplements) {
    try {
      const { data: supplements } = await supabase
        .from('stack_items')
        .select('*')
        .eq('profile_id', (profile as any).id)
        .eq('item_type', 'supplements')
        .eq('public', true)
        .order('created_at', { ascending: false })
      publicSupplements = supplements || []
    } catch (error) {
      console.error('Failed to fetch supplements:', error)
      publicSupplements = []
    }
  }

  // Fetch protocols
  if (publicModules.protocols) {
    try {
      const { data: protocols } = await supabase
        .from('protocols')
        .select('*')
        .eq('profile_id', (profile as any).id)
        .eq('public', true)
        .order('created_at', { ascending: false })
      publicProtocols = protocols || []
    } catch (error) {
      console.error('Failed to fetch protocols:', error)
      publicProtocols = []
    }
  }

  // Fetch movement
  if (publicModules.movement) {
    try {
      const { data: movement } = await supabase
        .from('stack_items')
        .select('*')
        .eq('profile_id', (profile as any).id)
        .eq('item_type', 'movement')
        .eq('public', true)
        .order('created_at', { ascending: false })
      publicMovement = movement || []
    } catch (error) {
      console.error('Failed to fetch movement:', error)
      publicMovement = []
    }
  }

  // Fetch mindfulness
  if (publicModules.mindfulness) {
    try {
      const { data: mindfulness } = await supabase
        .from('stack_items')
        .select('*')
        .eq('profile_id', (profile as any).id)
        .eq('item_type', 'mindfulness')
        .eq('public', true)
        .order('created_at', { ascending: false })
      publicMindfulness = mindfulness || []
    } catch (error) {
      console.error('Failed to fetch mindfulness:', error)
      publicMindfulness = []
    }
  }

  // Fetch gear
  if (publicModules.gear) {
    try {
      const { data: gear } = await supabase
        .from('gear')
        .select('*')
        .eq('profile_id', (profile as any).id)
        .eq('public', true)
        .order('created_at', { ascending: false })
      publicGear = gear || []
    } catch (error) {
      console.error('Failed to fetch gear:', error)
      publicGear = []
    }
  }

  // Fetch uploads
  if (publicModules.uploads) {
    try {
      const { data: uploads } = await supabase
        .from('uploads')
        .select('*')
        .eq('profile_id', (profile as any).id)
        .eq('public', true)
        .order('created_at', { ascending: false })
      publicUploads = uploads || []
    } catch (error) {
      console.error('Failed to fetch uploads:', error)
      publicUploads = []
    }
  }

  // Fetch journal entries
  if (publicModules.journal) {
    try {
      const { data: journalEntries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('profile_id', (profile as any).id)
        .eq('public', true)
        .order('created_at', { ascending: false })
      publicJournalEntries = journalEntries || []
    } catch (error) {
      console.error('Failed to fetch journal entries:', error)
      publicJournalEntries = []
    }
  }

  // Fetch mood data (only if feature is enabled)
  console.log('Mood tracking check:', {
    publicModulesMood: publicModules.mood,
    envEnabled: process.env.NEXT_PUBLIC_MOOD_TRACKING_ENABLED,
    nodeEnv: process.env.NODE_ENV
  })
  
  // Only show mood tracking if feature flag is enabled (development or explicit flag)
  const isMoodTrackingEnabled = process.env.NEXT_PUBLIC_MOOD_TRACKING_ENABLED === 'true' || process.env.NODE_ENV === 'development'
  
  if (publicModules.mood && isMoodTrackingEnabled) {
    try {
      try {
        const { getPublicMoodData } = await import('@/lib/db/mood')
        publicMoodData = await getPublicMoodData((profile as any).id, 30)
        console.log('Mood data loaded:', publicMoodData.length, 'entries')
      } catch (error) {
        console.warn('Mood tracking not available for public profile:', error)
        publicMoodData = []
      }
    } catch (error) {
      console.error('Failed to fetch mood data:', error)
      publicMoodData = []
    }
  } else {
    console.log('Mood tracking disabled - publicModules.mood:', publicModules.mood, 'env:', process.env.NEXT_PUBLIC_MOOD_TRACKING_ENABLED, 'isMoodTrackingEnabled:', isMoodTrackingEnabled)
  }

  // Fetch public library items
  let publicLibraryItems: any[] = []
  
  if (profile) {
    try {
      publicLibraryItems = await getPublicLibraryItems((profile as any).id)
    } catch (error) {
      console.error('Failed to fetch library items:', error)
      publicLibraryItems = []
    }
  }

  // Fetch follower count if profile allows it
  let followerCount = 0
  if (profile && (profile as any).show_public_followers) {
    try {
      // Use count query instead of select for better performance
      const { count, error: countError } = await supabase
        .from('stack_followers')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', (profile as any).user_id)
        .not('verified_at', 'is', null)
      
      if (countError) {
        console.warn('Failed to fetch follower count:', countError)
        followerCount = 0
      } else {
        followerCount = count || 0
      }
    } catch (error) {
      console.warn('Failed to fetch follower count:', error)
      followerCount = 0
    }
  }


  if (profileError || !profile) {
    notFound()
  }

  // Check if this is a shared public link (clean view) or app view (with edit capabilities)
  const isSharedPublicLink = search?.public === 'true'

  // Prepare profile data with additional fields
  const profileWithData = {
    ...profile,
    tier: (profile as any).tier || 'free',
    isInTrial: (profile as any).is_in_trial || false,
    trialEndedAt: (profile as any).trial_ended_at
  }


  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header - Brand First Design */}
      <div className="bg-white shadow-sm">
        {/* Row 1: Brand Only */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-3 sm:py-4">
            <Link href="/" className="inline-flex items-center">
              <img
                src="/BIOSTACKR LOGO 2.png"
                alt="Biostackr"
                className="h-14 w-auto"
              />
              <span className="sr-only">Biostackr</span>
            </Link>
          </div>
        </div>

        {/* Row 2: Utility Toolbar */}
        <div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2">
              {/* Discrete URL Display */}
              <div className="text-xs text-gray-400 font-mono">
                biostackr.io
              </div>
              
              <div className="flex items-center gap-3">
              {/* Show Copy Link + Dashboard buttons only for profile owners in app view (not shared links) */}
              {isOwnProfile && !isSharedPublicLink && (
                <>
                  <ProfileActionButtons
                    isOwnProfile={true}
                    profileName={profileWithData.display_name || 'this user'}
                    profileSlug={profileWithData.slug}
                  />
                  <Link 
                    href="/dash" 
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                </>
              )}

              {/* Follow Button - Show for visitors or when viewing someone else's profile */}
              {(!isOwnProfile || isSharedPublicLink) && (
                <>
                  <FollowButton
                    ownerUserId={(profile as any).user_id}
                    ownerName={(profile as any).display_name || 'this user'}
                    allowsFollowing={(profile as any).allow_stack_follow ?? true}
                  />
                </>
              )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Header - Clean Profile Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Health Stack Heading - Centered and Prominent */}
        <div className="text-center py-6 pb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {profile.display_name ? `${profile.display_name}'s Stack` : 'human upgrade'}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Mood • Sleep • Pain • Supps/Meds • Protocols • Journal — with heatmap + day snapshots
          </p>
        </div>
      </div>

      {/* Profile content with exact module alignment */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8" style={{ padding: '2rem' }}>
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              {profileWithData.avatar_url ? (
                <img 
                  src={profileWithData.avatar_url} 
                  alt={profileWithData.display_name || 'Profile'} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-100">
                  <span className="text-2xl font-bold text-gray-400">
                    {(profileWithData.display_name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {profileWithData.display_name || 'Anonymous User'}
              </h1>
              {profileWithData.bio && (
                <p className="text-gray-600 mb-4 max-w-2xl">
                  {profileWithData.bio}
                </p>
              )}
              
              {/* Public Profile Header with follower count and other stats */}
              <PublicProfileWithFollow
                profile={profileWithData}
                isOwnProfile={isOwnProfile}
                initialFollowerCount={followerCount}
                showFollowerCount={(profile as any).show_public_followers ?? true}
                isSharedPublicLink={isSharedPublicLink}
                isBetaUser={false} // TODO: Add beta user detection
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <PublicProfileClientWrapper
        profile={profileWithData}
        publicSupplements={publicSupplements}
        publicProtocols={publicProtocols}
        publicMovement={publicMovement}
        publicMindfulness={publicMindfulness}
        publicGear={publicGear}
        publicUploads={publicUploads}
        publicLibraryItems={publicLibraryItems}
        publicJournalEntries={publicJournalEntries}
        publicMoodData={publicMoodData}
        publicShopGearItems={[]}
        publicModules={publicModules}
        isOwnProfile={isOwnProfile}
        isSharedPublicLink={isSharedPublicLink}
        isMoodTrackingEnabled={isMoodTrackingEnabled}
      />

      {/* Footer - Biostackr Branding */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center justify-center mb-4">
              <img
                src="/BIOSTACKR LOGO 2.png"
                alt="Biostackr"
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-500">
              Track your health journey with BioStackr
            </p>
            <div className="mt-4">
              <Link 
                href="/auth/signup" 
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Create Your Stack
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
