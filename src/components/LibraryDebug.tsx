'use client'

import { useState } from 'react'
import { createClient } from '../lib/supabase/client'

export default function LibraryDebug() {
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    setDebugInfo('')
    
    try {
      const supabase = createClient()
      let info = '🔍 Library Setup Diagnostics\n\n'
      
      // Check authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        info += '❌ Authentication: Not logged in\n'
        setDebugInfo(info)
        setLoading(false)
        return
      }
      info += `✅ Authentication: Logged in as ${user.email}\n`
      
      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, slug')
        .eq('user_id', user.id)
        .single()
      
      if (profileError || !profile) {
        info += '❌ Profile: Not found\n'
      } else {
        info += `✅ Profile: Found (${(profile as any).id})\n`
      }
      
      // Check library_items table
      try {
        const { data: items, error: itemsError } = await supabase
          .from('library_items')
          .select('count(*)')
          .limit(1)
        
        if (itemsError) {
          info += `❌ Library Table: ${itemsError.message}\n`
        } else {
          info += '✅ Library Table: Accessible\n'
        }
      } catch (error) {
        info += `❌ Library Table: ${error}\n`
      }
      
      // Check storage buckets
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        
        if (bucketsError) {
          info += `❌ Storage Access: ${bucketsError.message}\n`
        } else {
          info += `✅ Storage Access: Can list buckets (${buckets?.length || 0} total)\n`
          
          const libraryBucket = buckets?.find(bucket => bucket.id === 'library')
          if (libraryBucket) {
            info += `✅ Library Bucket: Found\n`
            info += `   - Public: ${libraryBucket.public}\n`
            info += `   - Size Limit: ${(libraryBucket.file_size_limit || 0) / 1024 / 1024}MB\n`
            info += `   - Allowed Types: ${libraryBucket.allowed_mime_types?.length || 0} types\n`
          } else {
            info += '❌ Library Bucket: Not found\n'
            info += `   Available buckets: ${buckets?.map(b => b.id).join(', ') || 'none'}\n`
          }
        }
      } catch (error) {
        info += `❌ Storage Access: ${error}\n`
      }
      
      // Test file upload capability
      try {
        const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
        const testPath = `${user.id}/test_${Date.now()}.txt`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('library')
          .upload(testPath, testFile)
        
        if (uploadError) {
          info += `❌ Upload Test: ${uploadError.message}\n`
        } else {
          info += '✅ Upload Test: Success\n'
          
          // Clean up test file
          await supabase.storage.from('library').remove([testPath])
          info += '   (Test file cleaned up)\n'
        }
      } catch (error) {
        info += `❌ Upload Test: ${error}\n`
      }
      
      setDebugInfo(info)
    } catch (error) {
      setDebugInfo(`❌ Diagnostics failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Library Setup Diagnostics</h3>
      
      <button
        onClick={runDiagnostics}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
      </button>
      
      {debugInfo && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="text-sm whitespace-pre-wrap font-mono">{debugInfo}</pre>
        </div>
      )}
    </div>
  )
}
