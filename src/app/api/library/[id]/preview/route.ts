import { createClient } from '../../../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Get the library item with service role to bypass RLS for public items
    const { data: item, error: itemError } = await supabase
      .from('library_items')
      .select('*')
      .eq('id', id)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Check access permissions
    const { data: { user } } = await supabase.auth.getUser()
    
    let hasAccess = false

    // Public items are accessible to everyone (including anonymous users)
    if (item.is_public) {
      hasAccess = true
    }
    
    // Owner always has access (if authenticated)
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profile && profile.id === item.profile_id) {
        hasAccess = true
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the file content directly for preview
    const { data: fileData, error: fileError } = await supabase.storage
      .from('library')
      .download(item.file_url)

    if (fileError || !fileData) {
      console.error('Failed to download file:', fileError)
      return NextResponse.json({ error: 'File not accessible' }, { status: 500 })
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Set appropriate headers based on file type
    const headers = new Headers()
    
    if (item.file_type.startsWith('image/')) {
      headers.set('Content-Type', item.file_type)
      headers.set('Cache-Control', 'public, max-age=3600')
    } else if (item.file_type === 'application/pdf') {
      headers.set('Content-Type', 'application/pdf')
      headers.set('Cache-Control', 'public, max-age=3600')
      // Add headers to allow iframe embedding
      headers.set('X-Frame-Options', 'SAMEORIGIN')
    }

    // Return the file content directly
    return new NextResponse(buffer, { headers })

  } catch (error) {
    console.error('Preview API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
