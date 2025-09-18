import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="hover:opacity-90 transition-opacity">
                <img 
                  src="/BIOSTACKR LOGO.png" 
                  alt="Biostackr" 
                  className="h-16 w-auto"
                  style={{ width: '300px' }}
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dash" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/auth/signin" 
                className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 text-balance" style={{ color: '#0F1115' }}>
            Share Your Health Journey
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-balance" style={{ color: '#5C6370' }}>
            Create a clean, professional profile to showcase your biohacking stack, 
            protocols, and wellness journey. Share your knowledge with the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signup" 
              className="bg-gray-900 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
            <Link 
              href="/u/example" 
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              View Example Profile
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Public Profiles</h3>
            <p className="text-gray-600">
              Create shareable profiles with custom URLs to showcase your health journey.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stack Management</h3>
            <p className="text-gray-600">
              Organize supplements, devices, and protocols with detailed tracking.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Focus</h3>
            <p className="text-gray-600">
              Connect with like-minded individuals passionate about health optimization.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Open Pages. Built for the health optimization community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
