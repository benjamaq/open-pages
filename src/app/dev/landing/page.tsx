export default function DevLandingPreview() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-50 bg-yellow-50 border-b border-yellow-200 text-yellow-900 text-xs sm:text-sm px-4 py-2">
        DEV PREVIEW — Complete Landing (served from public/new-landing.html)
      </div>
      <iframe
        src="/new-landing.html"
        title="New Landing Dev Preview"
        className="w-full flex-1"
        style={{ border: '0' }}
      />
    </div>
  )
}



