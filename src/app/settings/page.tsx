import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
            {billing?.isPaid ? (
              <div className="mt-3">
                <div className="text-sm text-[#111111]">Plan: <span className="font-medium">Pro ✓</span></div>
                <div className="mt-1 text-sm text-[#4B5563]">
                  Member since: {billing?.subscription?.current_period_start ? new Date(billing.subscription.current_period_start).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : '—'}
                </div>
                <form action="/api/billing/portal" method="POST">
                  <button
                    type="submit"
                    className="mt-4 inline-flex items-center justify-center px-4 h-10 rounded-lg border border-[#E4E1DC] text-sm font-medium text-[#111111] hover:bg-[#F6F5F3]"
                  >
                    Manage Subscription
                  </button>
                </form>
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
                <div className="mt-3 text-sm text-[#111111]">$19/month or $149/year (save 35%)</div>
                <a
                  href="/checkout"
                  className="mt-4 inline-flex items-center justify-center px-4 h-10 rounded-lg bg-[#111111] text-white text-sm font-semibold hover:bg-black"
                >
                  Upgrade Now
                </a>
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



