import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  const bucket = 'uploads'
  try {
    // Ensure bucket exists
    const { data: got } = await supabaseAdmin.storage.getBucket(bucket)
    if (!got) {
      await supabaseAdmin.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 1024 * 1024 * 1024, // 1 GB
        allowedMimeTypes: [
          'application/octet-stream',
          'application/zip',
          'application/x-zip-compressed',
          'application/xml',
          'text/xml',
          'text/csv',
          'application/json'
        ]
      })
    } else {
      // Update limits and allowed mime types
      await supabaseAdmin.storage.updateBucket(bucket, {
        public: false,
        fileSizeLimit: 1024 * 1024 * 1024,
        allowedMimeTypes: [
          'application/octet-stream',
          'application/zip',
          'application/x-zip-compressed',
          'application/xml',
          'text/xml',
          'text/csv',
          'application/json'
        ]
      } as any)
    }
    return NextResponse.json({ ok: true, bucket })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed', bucket }, { status: 500 })
  }
}




