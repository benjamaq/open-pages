'use client'

import { useEffect } from 'react'
import { fireMetaEvent } from '@/lib/analytics'
import { createClient } from '@/lib/supabase/client'

export default function MetaView({ contentName, userIdProp, emailProp }: { contentName: string; userIdProp?: string; emailProp?: string }) {
  useEffect(() => {
    (async () => {
      try {
        let email = emailProp
        let externalId = userIdProp
        if (!email || !externalId) {
          try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              externalId = externalId || user.id
              email = email || user.email || undefined
            }
          } catch {}
        }
        await fireMetaEvent('ViewContent', { content_name: contentName }, { email, externalId })
      } catch {}
    })()
  }, [contentName, userIdProp, emailProp])

  return null
}


