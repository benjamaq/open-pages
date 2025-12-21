import { NextRequest, NextResponse } from 'next/server'

const CANON: Record<string, { id: string; name: string; defaultGoalTags: string[] }> = {
  canon_magnesium: { id: 'canon_magnesium', name: 'Magnesium', defaultGoalTags: ['sleep', 'mood'] },
  canon_creatine: { id: 'canon_creatine', name: 'Creatine', defaultGoalTags: ['cognitive', 'energy'] },
  canon_vitd: { id: 'canon_vitd', name: 'Vitamin D', defaultGoalTags: ['immunity', 'longevity'] },
}

export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = ctx.params.id
  const row = CANON[id]
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}




