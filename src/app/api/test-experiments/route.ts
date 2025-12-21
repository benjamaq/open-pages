import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
	const supabase = await createClient()
	
	// Try to get table structure
	const { data, error } = await supabase.rpc('get_table_columns', {
		table_name: 'experiments'
	})
	
	// If that doesn't work, try inserting minimal data to see what's required
	const { data: authData } = await supabase.auth.getUser()
	const user = (authData as any)?.user
	
	if (user) {
		// Try inserting with ONLY id to see what columns are required
		const { data: testInsert, error: insertError } = await supabase
			.from('experiments')
			.insert({})
			.select()
		
		return NextResponse.json({
			insertError: (insertError as any)?.message || null,
			insertDetails: (insertError as any)?.details || null,
			hint: (insertError as any)?.hint || null
		})
	}
	
	return NextResponse.json({ error: 'No user' })
}


