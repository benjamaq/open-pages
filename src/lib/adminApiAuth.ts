import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminPanelAllowlistConfigured, isAdminPanelEmail } from '@/lib/adminPanelAllowlist'

/**
 * Production: allow `x-admin-key` matching ADMIN_API_KEY, or (when allowlist is configured)
 * a logged-in allowlisted email. If allowlist is not configured, only the header key is accepted.
 * Non-production: no check (existing dev behavior).
 */
export async function denyUnlessAdminApi(request: NextRequest): Promise<NextResponse | null> {
  if (process.env.NODE_ENV !== 'production') return null
  const key = request.headers.get('x-admin-key')
  if (key && key === process.env.ADMIN_API_KEY) return null
  if (!adminPanelAllowlistConfigured()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user && isAdminPanelEmail(user.email)) return null
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
