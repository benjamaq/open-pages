import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import { FileText, Image as ImageIcon, File, Edit2 } from 'lucide-react'
import ShareButton from '../../../components/ShareButton'
import SupplementsSection from '../../../components/SupplementsSection'
import JournalSection from '../../../components/JournalSection'
import PublicProfileClient from '../../../components/PublicProfileClient'
import FollowButton from '../../../components/FollowButton'
import PublicProfileHeader from '../../../components/PublicProfileHeader'

interface ProfilePageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Check if user is authenticated and get their profile
  const { data: { user } } = await supabase.auth.getUser()
  let currentUserProfile: { slug: string } | null = null
  
  if (user) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('slug')
      .eq('user_id', user.id)
      .single()
    currentUserProfile = userProfile as { slug: string } | null
  }

  // Fetch profile data from Supabase
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      stack_items:stack_items(*),
      protocols:protocols(*),
      uploads:uploads(*)
    `)
    .eq('slug', slug)
    .single()

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


  if (profileError || !profile) {
    notFound()
  }

  // Check if current user is viewing their own profile
  const isOwnProfile = !!(currentUserProfile && currentUserProfile.slug === slug)

  // Get public modules visibility settings
  const publicModules = (profile as any).public_modules || {
    supplements: true,
    protocols: true,
    movement: true,
    mindfulness: true,
    food: true,
    uploads: true,
    journal: true
  }

  // Filter for public items only
  const publicStackItems = (profile as any).stack_items?.filter((item: any) => item.public) || []
  const publicProtocols = (profile as any).protocols?.filter((protocol: any) => protocol.public) || []
  const publicUploads = (profile as any).uploads?.filter((upload: any) => upload.public) || []
  
  // Filter stack items by type (assuming we can differentiate by some field or naming convention)
  const publicSupplements = publicStackItems.filter((item: any) => 
    !item.name?.toLowerCase().includes('movement') && 
    !item.name?.toLowerCase().includes('mindfulness') &&
    !item.name?.toLowerCase().includes('exercise') &&
    !item.name?.toLowerCase().includes('meditation')
  )
  const publicMovement = publicStackItems.filter((item: any) => 
    item.name?.toLowerCase().includes('movement') || 
    item.name?.toLowerCase().includes('exercise') ||
    item.name?.toLowerCase().includes('workout') ||
    item.name?.toLowerCase().includes('run') ||
    item.name?.toLowerCase().includes('walk')
  )
  
  // Add sample movement data if none exists
  if (publicMovement.length === 0) {
    publicMovement.push(
      {
        id: 'sample-movement-1',
        name: 'Morning Run',
        dose: '30 minutes',
        timing: 'Morning',
        notes: 'Zone 2 cardio',
        public: true
      },
      {
        id: 'sample-movement-2', 
        name: 'Strength Training',
        dose: '45 minutes',
        timing: 'Evening',
        notes: 'Upper body focus',
        public: true
      }
    )
  }
  
  const publicMindfulness = publicStackItems.filter((item: any) => 
    item.name?.toLowerCase().includes('mindfulness') || 
    item.name?.toLowerCase().includes('meditation') ||
    item.name?.toLowerCase().includes('breathing') ||
    item.name?.toLowerCase().includes('yoga')
  )
  
  // Add sample mindfulness data if none exists
  if (publicMindfulness.length === 0) {
    publicMindfulness.push(
      {
        id: 'sample-mindfulness-1',
        name: 'Morning Meditation',
        dose: '20 minutes',
        timing: 'Morning',
        notes: 'Focused breathing',
        public: true
      },
      {
        id: 'sample-mindfulness-2',
        name: 'Evening Yoga',
        dose: '15 minutes', 
        timing: 'Evening',
        notes: 'Gentle stretching',
        public: true
      }
    )
  }
  
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
  const stackItemsCount = publicStackItems.length
  const protocolsCount = publicProtocols.length
  const uploadsCount = publicUploads.length

  // Helper functions for rendering sections

  const renderProtocols = () => {
    if (publicProtocols.length === 0) return null

    return (
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#0F1115' }}>
            Protocols ({publicProtocols.length})
          </h2>
          <div className="space-y-4">
            {publicProtocols.map((protocol: any) => (
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
            ))}
          </div>
        </div>
      </section>
    )
  }

  const renderMovement = () => {
    if (publicMovement.length === 0) return null

    return (
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#0F1115' }}>
            Movement ({publicMovement.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicMovement.map((item: any) => (
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
            ))}
          </div>
        </div>
      </section>
    )
  }

  const renderMindfulness = () => {
    if (publicMindfulness.length === 0) return null

    return (
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#0F1115' }}>
            Mindfulness ({publicMindfulness.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicMindfulness.map((item: any) => (
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
            ))}
          </div>
        </div>
      </section>
    )
  }


  const renderUploads = () => {
    if (publicUploads.length === 0) return null

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
            {publicUploads.map((upload: any) => (
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
            ))}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-5 sm:py-6">
            <Link href="/" className="inline-flex items-center -ml-1">
              <img
                src="/BIOSTACKR LOGO.png"
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-end gap-3 py-3">
              {isOwnProfile && (
                <Link 
                  href="/dash" 
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
              )}
              
              {/* Share Button */}
              <ShareButton 
                profileSlug={profileWithData.slug}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              />

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

      {/* Profile Header - Clean Profile Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8 py-8">
          
          {/* Profile Photo - Larger */}
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

          {/* Profile Info */}
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-2">
              <h1 className="text-xl font-bold" style={{ color: '#0F1115' }}>
                {profileWithData.display_name || 'Anonymous Stackr'}
              </h1>
            </div>
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
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3 mt-4">
              {isOwnProfile && (
                <Link 
                  href="/dash" 
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
              )}
              
              {/* Share Button */}
              <ShareButton 
                profileSlug={profileWithData.slug}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              />

              {/* Follow Button - Only show to visitors */}
              {!isOwnProfile && (
                <FollowButton
                  ownerUserId={(profile as any).user_id}
                  ownerName={(profile as any).name || 'this user'}
                  allowsFollowing={false}
                />
              )}
            </div>
            
            {/* Daily Check-in Chips */}
            <PublicProfileHeader 
              profile={profileWithData}
              isOwnProfile={isOwnProfile}
            />
          </div>
        </div>
      </div>

      {/* Main Content - Modular Sections */}
      <PublicProfileClient
        profile={profile}
        publicSupplements={publicSupplements}
        publicProtocols={publicProtocols}
        publicMovement={publicMovement}
        publicMindfulness={publicMindfulness}
        publicUploads={publicUploads}
        publicJournalEntries={publicJournalEntries}
        publicModules={publicModules}
        isOwnProfile={isOwnProfile}
      />

      {/* Footer - Biostackr Branding */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm" style={{ color: '#A6AFBD' }}>
              Powered by{' '}
              <Link href="/" className="font-medium hover:underline" style={{ color: '#5C6370' }}>
                Biostackr
              </Link>
              {' '}• Share your health journey
            </p>
            <p className="text-xs mt-2" style={{ color: '#A6AFBD' }}>
              biostackr.com/u/{profileWithData.slug}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
