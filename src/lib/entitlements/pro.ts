export function isProActive(args: { tier?: string | null; pro_expires_at?: string | null }): boolean {
  const exp = args?.pro_expires_at ? String(args.pro_expires_at) : ''
  // Promo/beta/manual trials: pro_expires_at unlocks Pro even if tier is still 'free'.
  if (exp) {
    const ms = Date.parse(exp)
    if (Number.isFinite(ms)) return ms > Date.now()
    // If it's set but unparsable, fail open (treat as active) rather than locking a paid/trial user out.
    return true
  }
  // Permanent pro (Stripe/manual): pro_expires_at is NULL and tier indicates Pro-like access.
  const tierLc = String(args?.tier || '').toLowerCase()
  const isProTier = tierLc === 'pro' || tierLc === 'premium' || tierLc === 'creator'
  if (!isProTier) return false
  return true
}

export function isProTrial(args: { pro_expires_at?: string | null }): boolean {
  const exp = args?.pro_expires_at ? String(args.pro_expires_at) : ''
  if (!exp) return false
  const ms = Date.parse(exp)
  if (!Number.isFinite(ms)) return false
  return ms > Date.now()
}

export function getTrialDaysRemaining(args: { pro_expires_at?: string | null }): number | null {
  const exp = args?.pro_expires_at ? String(args.pro_expires_at) : ''
  if (!exp) return null
  const ms = Date.parse(exp)
  if (!Number.isFinite(ms)) return null
  const diff = ms - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}


