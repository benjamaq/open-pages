'use server'

import { createClient } from '@/lib/supabase/server'

export async function logSupplementTaken(supplementId: string, localDate: string, taken: boolean) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Unauthorized')
  }

  const { error: upsertError } = await supabase
    .from('supplement_logs')
    .upsert({
      user_id: user.id,
      supplement_id: supplementId,
      local_date: localDate,
      taken
    }, { onConflict: 'user_id,supplement_id,local_date' })

  if (upsertError) throw upsertError
  return { ok: true }
}

export async function getTodaySupplementLogs(): Promise<Array<{ supplement_id: string; taken: boolean }>> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return []
  const today = new Date().toLocaleDateString('sv-SE')
  const { data } = await supabase
    .from('supplement_logs')
    .select('supplement_id, taken')
    .eq('user_id', user.id)
    .eq('local_date', today)
  return (data as any) || []
}





