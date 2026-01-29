import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Temporary redirect: old dashboard route → new dashboard route
  if (pathname === '/dash') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  // Block legacy app surfaces and funnel to dashboard
  if (/^\/(pain|entries|tracking|migraines)(\/|$)/.test(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  // Public endpoint: allow unauthenticated access and skip session middleware
  if (pathname.startsWith('/api/checkin/magic')) {
    return NextResponse.next()
  }
  // Let the App Router handle routing for the root (/) and all other paths
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
    // Exclude API routes, Next internals, assets, and favicon from middleware
    // Also explicitly allow the magic check-in endpoint to be public
    '/((?!api/checkin/magic|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
