'use client'

import { useMemo, useState } from 'react'

export function PromoRedeemer({
  compact = false,
  defaultOpen = false,
  showToggle = true,
}: {
  compact?: boolean
  defaultOpen?: boolean
  showToggle?: boolean
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen))
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string>('')
  const [err, setErr] = useState<string>('')

  const normalized = useMemo(() => String(code || '').trim().toUpperCase(), [code])

  async function redeem() {
    setSaving(true)
    setErr('')
    setMsg('')
    try {
      const r = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized })
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErr(String(j?.error || 'Failed to redeem'))
        return
      }
      setMsg(String(j?.message || 'Promo code redeemed'))
    } catch (e: any) {
      setErr(e?.message || 'Failed to redeem')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={compact ? '' : 'mt-4'}>
      {showToggle && (
        <button
          type="button"
          className="text-sm text-gray-700 hover:underline"
          onClick={() => setOpen(v => !v)}
        >
          Have a promo code?
        </button>
      )}

      {open && (
        <div className="mt-3 rounded-xl border border-[#E4E1DC] bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Promo Code</div>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code (e.g., PH30)"
              className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm"
              autoCapitalize="characters"
            />
            <button
              type="button"
              onClick={redeem}
              disabled={saving || !normalized}
              className="h-10 px-4 rounded-lg bg-[#111111] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Redeeming…' : 'Redeem'}
            </button>
          </div>
          {msg && <div className="mt-2 text-sm text-emerald-700">{msg}</div>}
          {err && <div className="mt-2 text-sm text-red-700">{err}</div>}
        </div>
      )}
    </div>
  )
}


