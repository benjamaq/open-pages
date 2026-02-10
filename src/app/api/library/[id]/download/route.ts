import { createClient } from '../../../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get the library item
    const { data: item, error: itemError } = await supabase
      .from('library_items')
      .select('*')
      .eq('id', id)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Check download permissions
    const { data: { user } } = await supabase.auth.getUser()
    
    let hasDownloadAccess = false

    // Owner always has download access
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if ((profile as any) && (profile as any).id === (item as any).profile_id) {
        hasDownloadAccess = true
      }
    }

    // Public items with download permission
    if ((item as any).is_public && (item as any).allow_download) {
      hasDownloadAccess = true
    }

    if (!hasDownloadAccess) {
      return NextResponse.json({ error: 'Download not allowed' }, { status: 403 })
    }

    // Get signed URL for download
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('library')
      .createSignedUrl((item as any).file_url, 3600, {
        download: true // This forces download instead of preview
      })

    if (urlError || !signedUrlData?.signedUrl) {
      console.error('Failed to create signed download URL:', urlError)
      return NextResponse.json({ error: 'File not accessible' }, { status: 500 })
    }

    // Redirect to the signed download URL
    return NextResponse.redirect(signedUrlData.signedUrl)

  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
