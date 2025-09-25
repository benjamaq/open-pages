'use client'

import { useState } from 'react'
import PublicProfileClient from './PublicProfileClient'

interface PublicProfileClientWrapperProps {
  profile: any
  publicSupplements: any[]
  publicProtocols: any[]
  publicMovement: any[]
  publicMindfulness: any[]
  publicGear: any[]
  publicUploads: any[]
  publicLibraryItems: any[]
  publicJournalEntries: any[]
  publicShopGearItems: any[]
  publicModules: any
  isOwnProfile: boolean
  isSharedPublicLink: boolean
}

export default function PublicProfileClientWrapper(props: PublicProfileClientWrapperProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <PublicProfileClient {...props} />
    </div>
  )
}
