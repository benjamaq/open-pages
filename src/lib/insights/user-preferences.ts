import { createClient } from '@/lib/supabase/server'
import type { FormattedInsight } from './correlation-engine/types'

export async function pinInsight(userId: string, insightKey: string) {
  const supabase = await createClient()
  const expires = new Date()
  expires.setDate(expires.getDate() + 30)
  await supabase.from('user_insight_preferences').insert({
    user_id: userId,
    insight_key: insightKey,
    action: 'pin',
    expires_at: expires.toISOString(),
  } as any)
}

export async function hideInsight(userId: string, insightKey: string) {
  const supabase = await createClient()
  const expires = new Date()
  expires.setDate(expires.getDate() + 30)
  await supabase.from('user_insight_preferences').insert({
    user_id: userId,
    insight_key: insightKey,
    action: 'hide',
    expires_at: expires.toISOString(),
  } as any)
}

export async function getRecentInsightKeys(days: number): Promise<string[]> {
  const supabase = await createClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const { data } = await supabase
    .from('elli_messages')
    .select('context')
    .eq('message_type', 'insight')
    .gte('created_at', cutoff.toISOString())
  return (data || []).map((r: any) => r?.context?.insightKey).filter(Boolean)
}

export async function filterHiddenInsights(userId: string, insights: FormattedInsight[]): Promise<FormattedInsight[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_insight_preferences')
    .select('insight_key')
    .eq('user_id', userId)
    .eq('action', 'hide')
    .gt('expires_at', new Date().toISOString())
  const hidden = new Set((data || []).map((d: any) => d.insight_key))
  return insights.filter((i) => !hidden.has(i.insightKey))
}


