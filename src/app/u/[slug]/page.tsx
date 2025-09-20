import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import { FileText, Image as ImageIcon, File, Edit2 } from 'lucide-react'
import { headers } from 'next/headers'
import ShareButton from '../../../components/ShareButton'
import SupplementsSection from '../../../components/SupplementsSection'
import JournalSection from '../../../components/JournalSection'
import PublicProfileClientWrapper from '../../../components/PublicProfileClientWrapper'
import FollowButton from '../../../components/FollowButton'
import StickyNavigation from '../../../components/StickyNavigation'
import PublicProfileHeader from '../../../components/PublicProfileHeader'
import ProfileActionButtons from '../../../components/ProfileActionButtons'
import { getPublicLibraryItems } from '../../../lib/actions/library'

interface ProfilePageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProfilePage({ params, searchParams }: { 
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const search = await searchParams
  const supabase = await createClient()
  
  // Check for force public view parameter
  const forcePublicView = search?.public === 'true'

  // Check if user is authenticated and get their profile
  // Use a fresh supabase client to avoid cached sessions
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  let currentUserProfile: { slug: string } | null = null
  
  // Only proceed if we have a valid user and no error
  if (user && !userError) {
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('slug')
        .eq('user_id', user.id)
        .single()
      
      // Only set if we successfully got the profile
      if (!profileError && userProfile) {
        currentUserProfile = userProfile as { slug: string }
      }
    } catch (err) {
      console.log('Profile fetch error:', err)
      currentUserProfile = null
    }
  }

  // Fetch profile data from Supabase
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      protocols:protocols(*),
      uploads:uploads(*)
    `)
    .eq('slug', slug)
    .single()

  // Fetch different types of stack items separately
  let publicSupplements: any[] = []
  let publicMindfulness: any[] = []
  let publicMovement: any[] = []
  let publicGear: any[] = []

  if (profile) {
    const [supplementsResult, mindfulnessResult, movementResult, gearResult] = await Promise.all([
      supabase
        .from('stack_items')
        .select('*')
        .eq('profile_id', (profile as any).id)
        .eq('item_type', 'supplements')
        .eq('public', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('stack_items')
        .select('*')
        .eq('profile_id', (profile as any).id)
        .eq('item_type', 'mindfulness')
        .eq('public', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('stack_items')
        .select('*')
        .eq('profile_id', (profile as any).id)
        .eq('item_type', 'movement')
        .eq('public', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('gear')
        .select('*')
        .eq('profile_id', (profile as any).id)
        .eq('public', true)
        .order('category', { ascending: true })
        .order('created_at', { ascending: false })
    ])

    publicSupplements = supplementsResult.data || []
    publicMindfulness = mindfulnessResult.data || []
    publicMovement = movementResult.data || []
    publicGear = gearResult.data || []
  }

  // Try to fetch journal entries separately (in case table doesn't exist yet)
  let journalEntries: any[] = []
  try {
    const { data: journalData } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('profile_id', (profile as any)?.id)
      .eq('public', true)
      .order('created_at', { ascending: false })
    journalEntries = journalData || []
  } catch (error) {
    // Journal entries table not found, skipping journal data
    journalEntries = []
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


  if (profileError || !profile) {
    notFound()
  }

  // Check if current user is viewing their own profile
  // More robust check with explicit conditions, but allow override for public view
  const isOwnProfile = forcePublicView ? false : !!(
    currentUserProfile && 
    currentUserProfile.slug && 
    currentUserProfile.slug === slug &&
    user &&
    !userError
  )
  
  // Debug logging
  console.log('Public Profile Debug (Server):', {
    slug,
    user: user ? { id: user.id, email: user.email } : null,
    userError: userError?.message,
    currentUserProfile,
    isOwnProfile,
    comparison: {
      currentSlug: currentUserProfile?.slug,
      targetSlug: slug,
      matches: currentUserProfile?.slug === slug
    },
    timestamp: new Date().toISOString()
  })

  // Get public modules visibility settings
  const publicModules = (profile as any).public_modules || {
    supplements: true,
    protocols: true,
    movement: true,
    mindfulness: true,
    gear: true,
    library: true,
    journal: true
  }

  // Filter for public items only
  const publicProtocols = (profile as any).protocols?.filter((protocol: any) => protocol.public) || []
  const publicUploads = (profile as any).uploads?.filter((upload: any) => upload.public) || []
  
  // Use the separately fetched and properly filtered items
  // publicSupplements, publicMindfulness, publicMovement are already fetched above
  
  // publicSupplements, publicMindfulness, publicMovement are already properly fetched above
  
  
  // Use separately fetched journal entries
  const publicJournalEntries = journalEntries

  // Type assertion for the profile with related data
  const profileWithData = profile as {
    id: string
    user_id: string
    slug: string
    display_name: string
    bio: string | null
    avatar_url: string | null
    public: boolean
    created_at: string
    updated_at: string
    stack_items?: Array<{
      id: string
      profile_id: string
      name: string
      dose: string | null
      timing: string | null
      brand: string | null
      notes: string | null
      public: boolean
      created_at: string
      updated_at: string
    }>
    protocols?: Array<{
      id: string
      profile_id: string
      name: string
      details: string | null
      frequency: string | null
      public: boolean
      created_at: string
      updated_at: string
    }>
    uploads?: Array<{
      id: string
      profile_id: string
      file_url: string
      title: string
      description: string | null
      public: boolean
      created_at: string
      updated_at: string
    }>
  }

  // Count items for display
  const stackItemsCount = publicSupplements.length + publicMindfulness.length + publicMovement.length + publicGear.length
  const protocolsCount = (profile as any)?.protocols?.length || 0
  const uploadsCount = (profile as any)?.uploads?.length || 0

  // Helper functions for rendering sections

  const renderProtocols = () => {
    // Show if module is enabled, even if empty
    if (!publicModules.protocols) return null

    return (
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#0F1115' }}>
            Protocols ({publicProtocols.length})
          </h2>
          <div className="space-y-4">
            {publicProtocols.length > 0 ? (
              publicProtocols.map((protocol: any) => (
                <div key={protocol.id} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 text-base">{protocol.name}</h3>
                  <div className="mt-2 space-y-1">
                    {protocol.frequency && (
                      <p className="text-sm" style={{ color: '#5C6370' }}>Frequency: {protocol.frequency}</p>
                    )}
                    {protocol.details && (
                      <p className="text-sm" style={{ color: '#5C6370' }}>{protocol.details}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No protocols shared yet</p>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  const renderMovement = () => {
    // Show if module is enabled, even if empty
    if (!publicModules.movement) return null

    return (
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#0F1115' }}>
            Movement ({publicMovement.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicMovement.length > 0 ? (
              publicMovement.map((item: any) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 text-base">{item.name}</h3>
                  <div className="mt-2 space-y-1">
                    {item.dose && (
                      <p className="text-sm" style={{ color: '#5C6370' }}>Duration: {item.dose}</p>
                    )}
                    {item.timing && (
                      <p className="text-sm" style={{ color: '#5C6370' }}>Timing: {item.timing}</p>
                    )}
                    {item.notes && (
                      <p className="text-sm" style={{ color: '#A6AFBD' }}>Notes: {item.notes}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No movement activities shared yet</p>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  const renderMindfulness = () => {
    // Show if module is enabled, even if empty
    if (!publicModules.mindfulness) return null

    return (
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#0F1115' }}>
            Mindfulness ({publicMindfulness.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicMindfulness.length > 0 ? (
              publicMindfulness.map((item: any) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 text-base">{item.name}</h3>
                  <div className="mt-2 space-y-1">
                    {item.dose && (
                      <p className="text-sm" style={{ color: '#5C6370' }}>Duration: {item.dose}</p>
                    )}
                    {item.timing && (
                      <p className="text-sm" style={{ color: '#5C6370' }}>Timing: {item.timing}</p>
                    )}
                    {item.notes && (
                      <p className="text-sm" style={{ color: '#A6AFBD' }}>Notes: {item.notes}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No mindfulness practices shared yet</p>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }


  const renderUploads = () => {
    // Show if module is enabled, even if empty
    if (!publicModules.uploads) return null

    const getFileIcon = (fileType: string) => {
      if (fileType.startsWith('image/')) return <ImageIcon className="w-6 h-6" />
      if (fileType.includes('pdf')) return <FileText className="w-6 h-6" />
      return <File className="w-6 h-6" />
    }

    return (
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#0F1115' }}>
            Files & Labs ({publicUploads.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicUploads.length > 0 ? (
              publicUploads.map((upload: any) => (
                <div key={upload.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-gray-500">
                      {getFileIcon(upload.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{upload.title}</h3>
                      {upload.description && (
                        <p className="text-xs mt-1" style={{ color: '#5C6370' }}>{upload.description}</p>
                      )}
                      <a
                        href={upload.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium mt-2 inline-block hover:underline"
                        style={{ color: '#5C6370' }}
                      >
                        View File
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No files shared yet</p>
              </div>
            )}
          </div>
        </div>
      </section>
    )
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
                className="h-16 w-auto"
                style={{ height: '80px', width: 'auto' }}
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
              {isOwnProfile && (
                <Link 
                  href="/dash" 
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
              )}

              {/* Follow Button - Only show to visitors */}
              {!isOwnProfile && (
                <FollowButton
                  ownerUserId={(profile as any).user_id}
                  ownerName={(profile as any).name || 'this user'}
                  allowsFollowing={false}
                />
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
            My Health & Wellness Stack
          </h2>
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
                  alt={profileWithData.display_name}
                  className="w-32 h-32 object-cover rounded-2xl border border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl border border-gray-200 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {profileWithData.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Content */}
            <div className="flex-1 lg:flex lg:items-start lg:justify-between lg:gap-8">
              {/* Left: Core Identity */}
              <div className="flex-1 text-center lg:text-left">
                {/* Name and Buttons Row - Level with Photo Top */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                  <h1 className="text-3xl font-bold mb-3 lg:mb-0" style={{ color: '#0F1115' }}>
                    {profileWithData.display_name || 'Anonymous Stackr'}
                  </h1>
                  
                  {/* Action Buttons - Same Level as Name */}
                  <ProfileActionButtons 
                    isOwnProfile={isOwnProfile} 
                    profileName={profileWithData.display_name || 'this user'}
                  />
                </div>
                
                {/* Mission */}
                <div className="mb-4">
                  {profileWithData.bio ? (
                    <p className="text-base" style={{ color: '#5C6370' }}>
                      {profileWithData.bio}
                    </p>
                  ) : (
                    <p className="text-base italic" style={{ color: '#A6AFBD' }}>
                      No mission set
                    </p>
                  )}
                </div>
                
                {/* Core Status Pills - Clean Row */}
                <PublicProfileHeader 
                  profile={profileWithData}
                  isOwnProfile={isOwnProfile}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <PublicProfileClientWrapper
        profile={profile}
        publicSupplements={publicSupplements}
        publicProtocols={publicProtocols}
        publicMovement={publicMovement}
        publicMindfulness={publicMindfulness}
        publicGear={publicGear}
        publicUploads={publicUploads}
        publicLibraryItems={publicLibraryItems}
        publicJournalEntries={publicJournalEntries}
        publicShopGearItems={[]}
        publicModules={publicModules}
        isOwnProfile={isOwnProfile}
      />

      {/* Footer - Biostackr Branding */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img
                src="/BIOSTACKR LOGO 2.png"
                alt="BioStackr"
                className="h-8 w-auto"
              />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Create your own health stack
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              Get Started on BioStackr
            </Link>
            <p className="text-xs mt-3 text-gray-500">
              biostackr.com/u/{profileWithData.slug}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
