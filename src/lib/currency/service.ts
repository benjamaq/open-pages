'use server'

import { createClient } from '@/lib/supabase/server'

const SUPPORTED = ['USD','EUR','GBP','CAD','AUD','JPY','CHF','SEK','NOK','DKK','THB']

export async function updateExchangeRates(): Promise<void> {
  const supabase = await createClient()
  // Open, no-key endpoint
  const base = 'USD'
  const url = `https://open.er-api.com/v6/latest/${base}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`rate fetch ${res.status}`)
  const json = await res.json()
  const rows = SUPPORTED.map((code) => ({
    from_currency: base,
    to_currency: code,
    rate: Number(json?.rates?.[code] ?? 1),
    updated_at: new Date().toISOString()
  }))
  await supabase.from('exchange_rate').upsert(rows as any, { onConflict: 'from_currency,to_currency' })
}

export async function convertAmount(amount: number, from: string, to: string): Promise<number> {
  if (!amount || from === to) return Number(amount || 0)
  const supabase = await createClient()
  // Try direct
  let { data } = await supabase
    .from('exchange_rate')
    .select('rate')
    .eq('from_currency', from)
    .eq('to_currency', to)
    .maybeSingle()
  if ((data as any)?.rate) return Number(amount) * Number((data as any).rate)
  // Try reverse
  const rev = await supabase
    .from('exchange_rate')
    .select('rate')
    .eq('from_currency', to)
    .eq('to_currency', from)
    .maybeSingle()
  if ((rev.data as any)?.rate) return Number(amount) / Number((rev.data as any).rate)
  // Fallback via USD
  if (from !== 'USD') {
    const toUsd = await convertAmount(amount, from, 'USD')
    return convertAmount(toUsd, 'USD', to)
  }
  return Number(amount)
}

export async function formatCurrency(amount: number, currency: string): Promise<string> {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)
  } catch {
    return `$${Number(amount || 0).toFixed(2)}`
  }
}


