import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function SignupPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  // Single signup route to avoid divergent promo redemption logic.
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams || {})) {
    if (Array.isArray(v)) {
      for (const vv of v) {
        if (vv != null) sp.append(k, String(vv))
      }
    } else if (v != null) {
      sp.set(k, String(v))
    }
  }
  const qs = sp.toString()
  redirect(qs ? `/signup?${qs}` : '/signup')
}
