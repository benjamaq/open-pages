import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Redirect root (/) to the static landing page in all environments
  const { pathname } = request.nextUrl
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone()
    url.pathname = '/landing-v2.html'
    // Serve the landing content at '/' without changing the URL
    const res = NextResponse.rewrite(url)
    res.headers.set('Cache-Control', 'no-store, max-age=0')
    return res
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    // Exclude Next internals, assets, favicon, and API routes from middleware
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
