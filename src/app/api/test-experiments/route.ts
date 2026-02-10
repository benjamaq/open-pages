import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
	const supabase = await createClient()
	
	// Try to get table structure
	const { data, error } = await (supabase as any).rpc('get_table_columns', {
		table_name: 'experiments'
	} as any)
	
	// If that doesn't work, try inserting minimal data to see what's required
	const { data: authData } = await supabase.auth.getUser()
	const user = (authData as any)?.user
	
	if (user) {
		// Try inserting with ONLY id to see what columns are required
		const { data: testInsert, error: insertError } = await (supabase as any)
			.from('experiments')
			.insert({} as any)
			.select()
		
		return NextResponse.json({
			insertError: (insertError as any)?.message || null,
			insertDetails: (insertError as any)?.details || null,
			hint: (insertError as any)?.hint || null
		})
	}
	
	return NextResponse.json({ error: 'No user' })
}


