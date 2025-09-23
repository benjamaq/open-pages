import { NextResponse } from 'next/server'

// API endpoint to help clear browser cache
export async function GET() {
  const response = NextResponse.json({ 
    message: 'Cache cleared',
    timestamp: new Date().toISOString()
  })

  // Add aggressive cache-busting headers
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Last-Modified', new Date().toUTCString())
  response.headers.set('ETag', `"${Date.now()}"`)
  
  return response
}

