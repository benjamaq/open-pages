export function isProActive(args: { tier?: string | null; pro_expires_at?: string | null }): boolean {
  const tierLc = String(args?.tier || '').toLowerCase()
  const isProTier = tierLc === 'pro' || tierLc === 'premium' || tierLc === 'creator'
  if (!isProTier) return false
  const exp = args?.pro_expires_at ? String(args.pro_expires_at) : ''
  if (!exp) return true // permanent pro (existing behavior)
  const ms = Date.parse(exp)
  if (!Number.isFinite(ms)) return true
  return ms > Date.now()
}


