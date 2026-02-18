import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Ensure exactly one truth report row exists per (user_id, user_supplement_id).
 *
 * We delete any existing rows first to avoid races/duplicates when multiple writers fire.
 * DB-level uniqueness is still recommended (see supabase migration).
 */
export async function persistTruthReportSingle(payload: any): Promise<{ ok: true }> {
  const userId = String(payload?.user_id || '')
  const userSupplementId = String(payload?.user_supplement_id || '')
  if (!userId || !userSupplementId) {
    throw new Error('persistTruthReportSingle: missing user_id or user_supplement_id')
  }

  // Delete ALL existing rows for this pair, then insert exactly one.
  // Use service role client so RLS cannot block deletion/insertion.
  const { error: delErr } = await (supabaseAdmin as any)
    .from('supplement_truth_reports')
    .delete()
    .eq('user_id', userId)
    .eq('user_supplement_id', userSupplementId as any)
  if (delErr) throw delErr

  const { error: insErr } = await (supabaseAdmin as any)
    .from('supplement_truth_reports')
    .insert(payload as any)
  if (insErr) throw insErr

  return { ok: true }
}


