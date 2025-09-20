import { createClient } from '../../../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Get the library item
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

    // Public items are accessible to everyone
    if (item.is_public) {
      hasAccess = true
    }
    
    // Owner always has access
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

    // Get signed URL for the file
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('library')
      .createSignedUrl(item.file_url, 3600) // 1 hour expiry

    if (urlError || !signedUrlData?.signedUrl) {
      console.error('Failed to create signed URL:', urlError)
      return NextResponse.json({ error: 'File not accessible' }, { status: 500 })
    }

    // For preview, we want to redirect to the signed URL
    // This allows the browser to handle the file display
    return NextResponse.redirect(signedUrlData.signedUrl)

  } catch (error) {
    console.error('Preview API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
