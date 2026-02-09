import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ supplementId: string }> }) {
  // v1 stubbed community data
  const { supplementId } = await params
  if (!supplementId) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }
  // Simulated signal; could map by id later
  const payload = {
    keyInsight: '67% of BioStackr users report improved sleep quality by Week 2.',
    timeCurve: [2,3,5,7,8,10,12],
    topTags: ['Sleep','Calm','Stress'],
    goalAlignment: {
      userGoals: [],
      community: { Sleep: 67, Calm: 41, Stress: 28 }
    }
  }
  return NextResponse.json(payload)
}





