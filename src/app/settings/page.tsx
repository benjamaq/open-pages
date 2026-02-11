import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/SettingsForm'
import UpgradeButton from '@/components/billing/UpgradeButton'

export default async function SettingsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Profile tier is the source of truth for "Pro" access in some accounts (manual grants, migrations, etc.)
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('tier,created_at')
    .eq('user_id', user.id)
    .maybeSingle()
  const tierLc = String((profileRow as any)?.tier || '').toLowerCase()
  const isPaidByTier = tierLc === 'pro' || tierLc === 'premium' || tierLc === 'creator'

  const hdrs = await headers()
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3010'
  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  const baseUrl = `${proto}://${host}`
  const cookieHeader = hdrs.get('cookie') ?? ''

  const [settingsRes, planRes, billingRes] = await Promise.all([
    fetch(`${baseUrl}/api/settings`, { headers: { cookie: cookieHeader }, cache: 'no-store' }),
    fetch(`${baseUrl}/api/payments/status`, { headers: { cookie: cookieHeader }, cache: 'no-store' }).catch(() => null),
    fetch(`${baseUrl}/api/billing/info`, { headers: { cookie: cookieHeader }, cache: 'no-store' }).catch(() => null),
  ])
  const settings = settingsRes.ok ? await settingsRes.json() : { reminder_enabled: false, reminder_time: '06:00', reminder_timezone: null, email: user.email }
  const plan = planRes && planRes.ok ? await planRes.json() : { is_member: false }
  const billing = billingRes && billingRes.ok ? await billingRes.json() : { isPaid: false, subscription: null }
  const billingError = String(searchParams?.billing_error || '').trim()
  const isPaid = Boolean(billing?.isPaid) || Boolean(isPaidByTier)
  const hasStripeSubscription = Boolean(billing?.subscription)
  const memberSinceISO =
    (billing as any)?.subscription?.current_period_start
      ? String((billing as any).subscription.current_period_start)
      : ((profileRow as any)?.created_at ? String((profileRow as any).created_at) : '')

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/white.png?v=1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/dashboard" className="text-sm text-slate-700 hover:underline">← Back to Dashboard</a>
          <div className="text-sm font-semibold text-slate-900">Settings</div>
          <div />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="rounded-xl border border-[#E4E1DC] bg-white p-5">
            <div className="text-xs font-semibold text-[#6B7280] tracking-wide">ACCOUNT</div>
            {billingError && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                We couldn’t open Stripe billing for this account. If you don’t have an active subscription, you can upgrade again below.
              </div>
            )}
            {isPaid ? (
              <div className="mt-3">
                <div className="text-sm text-[#111111]">
                  Plan:{' '}
                  <span className="font-medium">
                    {tierLc === 'creator' ? 'Creator ✓' : 'Pro ✓'}
                  </span>
                </div>
                <div className="mt-1 text-sm text-[#4B5563]">
                  Member since:{' '}
                  {memberSinceISO
                    ? new Date(memberSinceISO).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
                    : '—'}
                </div>
                {hasStripeSubscription ? (
                  <form action="/api/billing/portal" method="POST">
                    <button
                      type="submit"
                      className="mt-4 inline-flex items-center justify-center px-4 h-10 rounded-lg border border-[#E4E1DC] text-sm font-medium text-[#111111] hover:bg-[#F6F5F3]"
                    >
                      Manage Subscription
                    </button>
                  </form>
                ) : (
                  <div className="mt-4 rounded-lg border border-[#E4E1DC] bg-[#F6F5F3] p-3 text-sm text-[#111111]">
                    <div className="font-medium">Billing managed outside Stripe</div>
                    <div className="text-[#4B5563] mt-1">
                      Your account has Pro access, but we couldn’t find a Stripe subscription to manage here.
                      If you need to change billing, contact support.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <div className="text-sm text-[#111111]">Plan: <span className="font-medium">Free</span></div>
                <div className="mt-3 text-sm text-[#111111] font-medium">Upgrade to Pro</div>
                <ul className="mt-1 text-sm text-[#4B5563] list-disc list-inside space-y-0.5">
                  <li>See which supplements actually work</li>
                  <li>Get verdicts: Keep, Drop, or Retest</li>
                  <li>Full access to Results page</li>
                </ul>
                <div className="mt-3 text-sm text-[#111111]">$19/month or $149/year • $12.42/mo • Billed annually</div>
                <div className="mt-4">
                  <UpgradeButton
                    label="Upgrade Now"
                    className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-[#111111] text-white text-sm font-semibold hover:bg-black"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <SettingsForm
          initial={{
            reminder_enabled: Boolean(settings?.reminder_enabled),
            reminder_time: String(settings?.reminder_time || '06:00'),
            reminder_timezone: settings?.reminder_timezone || null
          }}
          email={settings?.email || user.email}
          isMember={Boolean(plan?.is_member)}
        />
      </main>
    </div>
  )
}



