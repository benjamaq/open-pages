import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type PeriodPayload = {
  id?: string
  start_date: string
  end_date?: string | null
  dose?: string | null
  notes?: string | null
}

function isFuture(dateISO?: string | null) {
  if (!dateISO) return false
  const d = new Date(dateISO)
  const today = new Date()
  d.setHours(0,0,0,0)
  today.setHours(0,0,0,0)
  return d.getTime() > today.getTime()
}

function hasOverlap(existing: { start_date: string; end_date: string | null }[], incoming: { start_date: string; end_date: string | null }) {
  const newStart = new Date(incoming.start_date)
  const newEnd = incoming.end_date ? new Date(incoming.end_date) : new Date()
  for (const p of existing) {
    const pStart = new Date(p.start_date)
    const pEnd = p.end_date ? new Date(p.end_date) : new Date()
    const overlaps =
      (newStart >= pStart && newStart <= pEnd) ||
      (newEnd >= pStart && newEnd <= pEnd) ||
      (newStart <= pStart && newEnd >= pEnd)
    if (overlaps) return true
  }
  return false
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('intervention_periods')
    .select('*')
    .eq('intervention_id', params.id)
    .order('start_date', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to load periods' }, { status: 500 })
  return NextResponse.json({ periods: data ?? [] })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as PeriodPayload
    if (!body.start_date) return NextResponse.json({ error: 'start_date is required' }, { status: 400 })
    if (isFuture(body.start_date) || isFuture(body.end_date ?? null)) {
      return NextResponse.json({ error: 'Dates cannot be in the future' }, { status: 400 })
    }
    if (body.end_date && new Date(body.end_date) < new Date(body.start_date)) {
      return NextResponse.json({ error: 'end_date must be after start_date' }, { status: 400 })
    }

    // Debug logging: payload and target column names
    console.log('[POST periods] intervention_id:', params.id, 'payload:', body)

    const { data: existing, error: existingError } = await supabase
      .from('intervention_periods')
      .select('start_date, end_date')
      .eq('intervention_id', params.id)
    if (existingError) {
      console.error('[POST periods] existing fetch error:', existingError)
      return NextResponse.json({ error: 'Failed to validate existing periods' }, { status: 500 })
    }

    if (hasOverlap(existing ?? [], { start_date: body.start_date, end_date: body.end_date ?? null })) {
      return NextResponse.json({ error: 'This period overlaps with an existing period' }, { status: 400 })
    }

    const insertPayload = {
      intervention_id: params.id, // FK column per migration
      start_date: body.start_date,
      end_date: body.end_date ?? null,
      dose: body.dose ?? null,
      notes: body.notes ?? null
    }
    const { data, error } = await supabase
      .from('intervention_periods')
      .insert(insertPayload as any)
      .select()
      .single()

    if (error) {
      console.error('[POST periods] supabase insert error:', error, 'payload:', insertPayload)
      return NextResponse.json({ error: error.message || 'Failed to create period' }, { status: 500 })
    }
    return NextResponse.json({ period: data })
  } catch (err: any) {
    console.error('[POST periods] unhandled error:', err?.stack || err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as PeriodPayload & { periodId: string }
  if (!body.periodId) return NextResponse.json({ error: 'periodId is required' }, { status: 400 })
  if (body.start_date && isFuture(body.start_date)) return NextResponse.json({ error: 'start_date in future' }, { status: 400 })
  if (body.end_date && isFuture(body.end_date)) return NextResponse.json({ error: 'end_date in future' }, { status: 400 })
  if (body.start_date && body.end_date && new Date(body.end_date) < new Date(body.start_date)) {
    return NextResponse.json({ error: 'end_date must be after start_date' }, { status: 400 })
  }

  // Pull existing to validate overlap (excluding the edited one)
  const { data: existing } = await supabase
    .from('intervention_periods')
    .select('id, start_date, end_date')
    .eq('intervention_id', params.id)

  if (existing) {
    const current = existing.find(p => p.id === body.periodId)
    const merged = {
      start_date: body.start_date ?? (current as any)?.start_date,
      end_date: (body.still_taking ? null : body.end_date) ?? (current as any)?.end_date ?? null
    }
    const others = existing.filter(p => p.id !== body.periodId).map(p => ({ start_date: p.start_date, end_date: p.end_date }))
    if (hasOverlap(others, merged)) {
      return NextResponse.json({ error: 'This period overlaps with an existing period' }, { status: 400 })
    }
  }

  const updates: Record<string, any> = {}
  if (body.start_date !== undefined) updates.start_date = body.start_date
  if (body.end_date !== undefined) updates.end_date = body.end_date
  if (body.dose !== undefined) updates.dose = body.dose
  if (body.notes !== undefined) updates.notes = body.notes

  const { data, error } = await supabase
    .from('intervention_periods')
    .update(updates)
    .eq('id', body.periodId)
    .eq('intervention_id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to update period' }, { status: 500 })
  return NextResponse.json({ period: data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { periodId } = (await req.json()) as { periodId: string }
  if (!periodId) return NextResponse.json({ error: 'periodId is required' }, { status: 400 })

  const { error } = await supabase
    .from('intervention_periods')
    .delete()
    .eq('id', periodId)
    .eq('intervention_id', params.id)

  if (error) return NextResponse.json({ error: 'Failed to delete period' }, { status: 500 })
  return NextResponse.json({ success: true })
}


