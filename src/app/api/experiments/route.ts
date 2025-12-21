import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  return NextResponse.json({ test: 'ok' })
}

export async function POST(request: Request) {
	console.log('📥 POST /api/experiments')
	
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		
		// Get user's profile_id
		const { data: profile } = await supabase
			.from('profiles')
			.select('id')
			.eq('user_id', user.id)
			.single()
		
		if (!profile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
		}
		
		const body = await request.json()
		const supplementId = body.supplement_id || body.supplementId
		
		if (!supplementId) {
			return NextResponse.json({ error: 'Missing supplement_id' }, { status: 400 })
		}
		
		const insertPayload = {
			profile_id: (profile as any).id,
			intervention_id: supplementId,
			hypothesis: `Testing ${(body.type || 'on_off')} for ${(body.duration || 7)} days`
		} as any
		
		console.log('💾 Inserting:', insertPayload)
		
		const { data: experiment, error } = await supabase
			.from('experiments')
			.insert(insertPayload)
			.select()
			.single()
		
		if (error) {
			console.error('❌ Insert error:', error)
			return NextResponse.json({ error: (error as any).message, code: (error as any).code }, { status: 500 })
		}
		
		console.log('✅ Created:', (experiment as any).id)
		return NextResponse.json(experiment)
		
	} catch (error: any) {
		console.error('💥 Error:', error)
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
}


