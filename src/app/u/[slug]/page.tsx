import { notFound } from 'next/navigation'

interface ProfilePageProps {
  params: {
    slug: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { slug } = params

  // TODO: Fetch profile data from Supabase
  // For now, return a placeholder
  if (slug === 'example') {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="text-xl font-semibold text-gray-900">
                  Open Pages
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Profile Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Biohacker Example
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Health optimization enthusiast sharing my journey and stack
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <span>• 12 Stack Items</span>
              <span>• 5 Protocols</span>
              <span>• 3 Files</span>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Stack Items */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Stack</h2>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Creatine Monohydrate</h3>
                  <p className="text-sm text-gray-600 mt-1">5g daily, morning</p>
                  <p className="text-sm text-gray-500 mt-2">Optimum Nutrition</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Omega-3</h3>
                  <p className="text-sm text-gray-600 mt-1">2g daily, with meals</p>
                  <p className="text-sm text-gray-500 mt-2">Nordic Naturals</p>
                </div>
              </div>
            </div>

            {/* Protocols */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Protocols</h2>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Morning Routine</h3>
                  <p className="text-sm text-gray-600 mt-1">Daily</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Cold shower, meditation, stack, journaling
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Sleep Optimization</h3>
                  <p className="text-sm text-gray-600 mt-1">Every evening</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Blue light blocking, magnesium, room temp 68°F
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return notFound()
}
