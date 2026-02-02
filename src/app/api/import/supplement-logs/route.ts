import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function parseCSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/)
  return lines.map(line => {
    const cells: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur.trim())
        cur = ''
      } else {
        cur += ch
      }
    }
    cells.push(cur.trim())
    return cells
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length < 2) return NextResponse.json({ error: 'CSV has no data' }, { status: 400 })

    const header = rows[0].map(h => h.replace(/^\uFEFF/, '').trim().toLowerCase())
    const idx = {
      supplement: header.findIndex(h => h === 'supplement' || h === 'name' || h === 'label'),
      start_date: header.findIndex(h => h === 'start_date' || h === 'start'),
      end_date: header.findIndex(h => h === 'end_date' || h === 'end'),
      dose: header.findIndex(h => h === 'dose'),
      notes: header.findIndex(h => h === 'notes'),
    }
    if (idx.supplement === -1 || idx.start_date === -1) {
      return NextResponse.json({ error: 'Missing required headers: supplement,start_date' }, { status: 400 })
    }

    let created = 0
    let updated = 0
    const errors: string[] = []

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      const name = (r[idx.supplement] || '').trim()
      const start = (r[idx.start_date] || '').slice(0, 10)
      const end = idx.end_date >= 0 ? (r[idx.end_date] || '').slice(0, 10) : ''
      const dose = idx.dose >= 0 ? (r[idx.dose] || '').trim() : ''
      const notes = idx.notes >= 0 ? (r[idx.notes] || '').trim() : ''
      if (!name || !start) continue

      // Try to find existing by case-insensitive name for this user
      const { data: existing } = await supabaseAdmin
        .from('user_supplement')
        .select('id,name')
        .eq('user_id', user.id)
        .ilike('name', name)
        .limit(1)
        .maybeSingle()

      if (existing?.id) {
        const { error: upErr } = await supabaseAdmin
          .from('user_supplement')
          .update({ inferred_start_at: start, dose: dose || undefined, notes: notes || undefined })
          .eq('id', existing.id)
          .eq('user_id', user.id)
        if (upErr) {
          errors.push(`Row ${i + 1}: ${upErr.message}`)
        } else {
          updated++
        }
      } else {
        const { data: ins, error: insErr } = await supabaseAdmin
          .from('user_supplement')
          .insert({
            user_id: user.id,
            name,
            inferred_start_at: start,
            dose: dose || null,
            notes: notes || null,
            is_active: true
          } as any)
          .select('id')
          .maybeSingle()
        if (insErr) {
          errors.push(`Row ${i + 1}: ${insErr.message}`)
        } else {
          created++
        }
      }
      // Optional: no-op for end_date; periods API handles ranges
    }

    const result = { created, updated, errorsCount: errors.length }
    if (errors.length > 0) {
      return NextResponse.json({ ok: true, result, errors }, { status: 207 })
    }
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}
