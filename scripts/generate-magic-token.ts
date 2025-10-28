import crypto from 'crypto'

function getServiceClient() {
  const { createClient } = require('@supabase/supabase-js')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase env')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function main() {
  const userId = process.argv[2]
  const hours = Number(process.argv[3] || 48)
  if (!userId) {
    console.error('Usage: tsx scripts/generate-magic-token.ts <userId> [expiryHours]')
    process.exit(1)
  }

  const supabase = getServiceClient()
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from('magic_checkin_tokens')
    .insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt })

  if (error) {
    console.error('Failed to store token hash:', error)
    process.exit(1)
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3009'
  const url = `${baseUrl}/api/checkin/magic?token=${rawToken}`
  console.log('Magic token (raw, DO NOT STORE):', rawToken)
  console.log('Magic URL:', url)
  console.log('Expires at:', expiresAt)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


