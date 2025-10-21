import { notFound } from 'next/navigation'
import { createClient } from '../../../../../lib/supabase/server'
import type { Metadata } from 'next'

interface CheckinSharePageProps {
  params: Promise<{
    slug: string
    date: string
  }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

// Generate metadata for check-in sharing
export async function generateMetadata({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string; date: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const { slug, date } = await params
  const search = await searchParams
  const supabase = await createClient()
  
  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, avatar_url, public')
    .eq('slug', slug)
    .single()

  if (!profile || !(profile as any).public) {
    return {
      title: 'Check-in Not Found',
      description: 'This check-in is not available or does not exist.'
    }
  }

  const profileData = profile as any
  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  // Get check-in data from URL parameters
  const energy = search?.energy ? Number(search.energy) : 7
  const mood = search?.mood ? String(search.mood) : ''
  // Optional numeric sliders for readiness (if provided by sharer)
  const moodScore = search && (search as any).moodScore ? Number((search as any).moodScore) : null
  const sleepScore = search && (search as any).sleep ? Number((search as any).sleep) : (search && (search as any).sleepScore ? Number((search as any).sleepScore) : null)
  const painScore = search && (search as any).pain ? Number((search as any).pain) : (search && (search as any).painScore ? Number((search as any).painScore) : null)
  const readiness = ((): number | null => {
    if (moodScore == null && sleepScore == null && painScore == null) return null
    const m = (moodScore ?? 5)
    const s = (sleepScore ?? 5)
    const p = (painScore ?? 0)
    return Math.round(((m * 0.2) + (s * 0.4) + ((10 - p) * 0.4)) * 10)
  })()
  const supplementsCount = search?.supplements ? Number(search.supplements) : 0
  const protocols = search?.protocols ? String(search.protocols).split(',') : []
  const movement = search?.movement ? String(search.movement).split(',') : []
  const mindfulness = search?.mindfulness ? String(search.mindfulness).split(',') : []
  
  const title = `${profileData.display_name}'s Daily Check-in - ${formattedDate}`
  const description = `Energy ${energy}/10${mood ? ` • ${mood}` : ''}${supplementsCount > 0 ? ` • ${supplementsCount} supplements` : ''}${protocols.length > 0 ? ` • ${protocols.join(', ')}` : ''}${movement.length > 0 ? ` • ${movement.join(', ')}` : ''}${mindfulness.length > 0 ? ` • ${mindfulness.join(', ')}` : ''}`
  const image = profileData.avatar_url || '/og-default.png'
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/checkin/${slug}/${date}`

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
          alt: `${profileData.display_name}'s daily check-in`,
        },
      ],
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function CheckinSharePage({ params, searchParams }: CheckinSharePageProps) {
  const { slug, date } = await params
  const search = await searchParams
  const supabase = await createClient()
  
  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!profile || !(profile as any).public) {
    notFound()
  }

  const profileData = profile as any
  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  // Try to get check-in data from URL parameters or localStorage
  const energy = search?.energy ? Number(search.energy) : 7
  const mood = search?.mood ? String(search.mood) : 'Feeling good'
  const supplementsCount = search?.supplements ? Number(search.supplements) : 0
  const protocols = search?.protocols ? String(search.protocols).split(',') : []
  const movement = search?.movement ? String(search.movement).split(',') : []
  const mindfulness = search?.mindfulness ? String(search.mindfulness).split(',') : []
  const note = search?.note ? String(search.note) : ''

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {profileData.display_name}'s Daily Check-in
          </h1>
          <p className="text-lg text-gray-600">{formattedDate}</p>
        </div>

        {/* Check-in Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
          {/* Energy */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {energy}/10
            </div>
            <div className="text-xl text-gray-900">Energy Level</div>
          </div>

          {/* Readiness (if provided) */}
          {typeof readiness === 'number' && (
            <div className="text-center mb-6">
              <div className="text-sm font-semibold text-gray-900 mb-1">Daily Readiness Score</div>
              <div className="inline-flex items-center gap-2 border-2 border-black rounded-lg px-3 py-2 bg-white">
                <span className="text-3xl font-bold">{readiness}%</span>
                <span className="text-xl">{readiness >= 80 ? '☀️' : readiness >= 60 ? '🙂' : readiness >= 40 ? '🫧' : '🛠️'}</span>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                {readiness >= 80
                  ? 'Optimal capacity.'
                  : readiness >= 60
                    ? 'Good capacity.'
                    : readiness >= 40
                      ? 'Recovery focus.'
                      : 'Prioritize rest.'}
              </div>
            </div>
          )}

          {/* Mood */}
          {mood && (
            <div className="text-center mb-6">
              <div className="text-lg text-gray-700">{mood}</div>
            </div>
          )}

          {/* Routine Summary */}
          <div className="space-y-4 mb-6">
            {supplementsCount > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-900">💊 Supplements</span>
                <span className="text-gray-600">{supplementsCount} items</span>
              </div>
            )}
            
            {protocols.length > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-900">🧪 Protocols</span>
                <span className="text-gray-600">{protocols.join(', ')}</span>
              </div>
            )}
            
            {movement.length > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-900">🏃 Movement</span>
                <span className="text-gray-600">{movement.join(', ')}</span>
              </div>
            )}
            
            {mindfulness.length > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-900">🧘 Mindfulness</span>
                <span className="text-gray-600">{mindfulness.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Note */}
          {note && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700 italic">"{note}"</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center">
            <a 
              href={`/u/${slug}?public=true`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              View {profileData.display_name}'s full stack →
            </a>
            <div className="text-sm text-gray-500 mt-2">
              Powered by BioStackr
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <a 
            href="/auth/signup"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Create Your Own Health Stack
          </a>
        </div>
      </div>
    </div>
  )
}
