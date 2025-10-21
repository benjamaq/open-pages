'use client'

import { useState, useEffect } from 'react'
import JournalSection from './JournalSection'
import SupplementsSection from './SupplementsSection'
import ProtocolsSection from './ProtocolsSection'
import MovementSection from './MovementSection'
import MindfulnessSection from './MindfulnessSection'
import GearSection from './GearSection'
import PublicLibrarySection from './PublicLibrarySection'
import PublicShopMyGearSection from './PublicShopMyGearSection'
// Import mood component conditionally to prevent build failures
let PublicMoodSection: any = null
try {
  PublicMoodSection = require('./PublicMoodSection').default
  console.log('PublicMoodSection loaded successfully')
} catch (error) {
  console.warn('PublicMoodSection not available:', error)
}
import SectionToggleSheet from './SectionToggleSheet'
import OverviewSection from './OverviewSection'
import dayjs from 'dayjs'
import { updateJournalVisibility } from '../lib/actions/profile'
import { type PublicModules } from '../lib/actions/public-modules'
import { LibraryItem } from '../lib/actions/library'

interface JournalEntry {
  id: string
  profile_id: string
  heading: string | null
  body: string
  public: boolean
  created_at: string
  updated_at: string
}

interface PublicProfileClientProps {
  profile: any
  publicSupplements: any[]
  publicProtocols: any[]
  publicMovement: any[]
  publicMindfulness: any[]
  publicGear: any[]
  publicUploads: any[]
  publicLibraryItems: LibraryItem[]
  publicJournalEntries: JournalEntry[]
  publicMoodData: any[]
  publicShopGearItems: any[]
  publicModules: PublicModules
  isOwnProfile: boolean
  isSharedPublicLink: boolean
  isMoodTrackingEnabled: boolean
}

export default function PublicProfileClient({
  profile,
  publicSupplements,
  publicProtocols,
  publicMovement,
  publicMindfulness,
  publicGear,
  publicUploads,
  publicLibraryItems,
  publicJournalEntries,
  publicMoodData,
  publicShopGearItems,
  publicModules,
  isOwnProfile,
  isSharedPublicLink,
  isMoodTrackingEnabled
}: PublicProfileClientProps) {
  const [showJournalPublic, setShowJournalPublic] = useState(profile.show_journal_public || false)
  const [currentModules, setCurrentModules] = useState<PublicModules>(publicModules || {
    supplements: true,
    protocols: true,
    movement: true,
    mindfulness: true,
    gear: true,
    uploads: true,
    library: true,
    journal: true
  })


  const handleJournalVisibilityToggle = async (visible: boolean) => {
    try {
      await updateJournalVisibility(profile.id, visible)
      setShowJournalPublic(visible)
    } catch (error) {
      console.error('Failed to update journal visibility:', error)
    }
  }

  const handleModulesUpdate = (updatedModules: PublicModules) => {
    setCurrentModules(updatedModules)
  }

  // Compute latest readiness (0-100) from mood data
  const latestReadiness: number | null = (() => {
    try {
      if (!Array.isArray(publicMoodData) || publicMoodData.length === 0) return null
      const sorted = [...publicMoodData].sort((a: any, b: any) => {
        const da = dayjs(a.date || a.local_date || a.created_at)
        const db = dayjs(b.date || b.local_date || b.created_at)
        return db.valueOf() - da.valueOf()
      })
      const latest = sorted[0]
      if (!latest) return null
      if (typeof latest.readiness === 'number' && Number.isFinite(latest.readiness)) return Math.round(latest.readiness)
      const mood = typeof latest.mood === 'number' ? latest.mood : null
      const sleep = typeof latest.sleep_quality === 'number' ? latest.sleep_quality : (typeof latest.sleep_hours === 'number' ? Math.min(10, Math.round(latest.sleep_hours)) : null)
      const pain = typeof latest.pain === 'number' ? latest.pain : null
      if (mood == null && sleep == null && pain == null) return null
      const m = mood ?? 5
      const s = sleep ?? 5
      const p = pain ?? 0
      return Math.round(((m * 0.2) + (s * 0.4) + ((10 - p) * 0.4)) * 10)
    } catch { return null }
  })()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      
      {/* Customization Controls (Owner Only, Not in Shared Public Link) */}
      {isOwnProfile && !isSharedPublicLink && (
        <div className="flex justify-end mb-3">
          <SectionToggleSheet 
            currentModules={currentModules}
            onUpdate={handleModulesUpdate}
          />
        </div>
      )}

      {/* Mood Tracker section */}
      {(() => {
        // Safari sometimes drops this branch if props are undefined early.
        // Force-enable mood tracker whenever we have a PublicMoodSection and any data (or explicitly enabled).
        const enabled = (currentModules?.mood ?? true) && !!PublicMoodSection && (isMoodTrackingEnabled ?? true)
        const hasData = Array.isArray(publicMoodData) && publicMoodData.length >= 0
        return enabled && hasData
      })() && (
        <div id="mood" className="mb-8">
          <PublicMoodSection 
            key={`mood-${publicMoodData.length}-${Date.now()}`}
            moodData={publicMoodData}
            profileName={profile.display_name || 'this user'}
            publicSupplements={publicSupplements}
            publicProtocols={publicProtocols}
            publicMovement={publicMovement}
            publicMindfulness={publicMindfulness}
            publicGear={publicGear}
          />
        </div>
      )}

      {/* Journal section - Show if enabled, even if empty */}
      {currentModules?.journal && (
        <div id="journal">
          <JournalSection 
            journalEntries={publicJournalEntries} 
            showJournalPublic={showJournalPublic}
            onToggleVisibility={handleJournalVisibilityToggle}
            isOwnProfile={isOwnProfile && !isSharedPublicLink}
            profileId={profile.id}
          />
        </div>
      )}
      
      {/* Overview (top highlights) */}
      <OverviewSection 
        profile={profile}
        publicSupplements={publicSupplements}
        publicProtocols={publicProtocols}
        publicMovement={publicMovement}
        publicMindfulness={publicMindfulness}
        publicLibraryItems={[]}
        publicGear={publicGear}
        latestReadiness={latestReadiness}
      />

      {/* Other sections - Show if enabled, even if empty */}
      {currentModules?.supplements && (
        <SupplementsSection supplements={publicSupplements} />
      )}
      
      {currentModules?.protocols && (
        <ProtocolsSection protocols={publicProtocols} />
      )}
      
      {currentModules?.movement && (
        <MovementSection movementItems={publicMovement} />
      )}
      
      {currentModules?.mindfulness && (
        <MindfulnessSection mindfulnessItems={publicMindfulness} />
      )}
      
      
      {currentModules?.library && (
        <PublicLibrarySection 
          libraryItems={publicLibraryItems} 
          profileSlug={profile.slug}
        />
      )}

      {/* Shop My Gear Section (Creator Tier Only) */}
      {profile.tier === 'creator' && publicShopGearItems.length > 0 && (
        <PublicShopMyGearSection 
          items={publicShopGearItems}
          isOwner={isOwnProfile && !isSharedPublicLink}
        />
      )}
      
      {currentModules?.gear && (
        <GearSection gear={publicGear} />
      )}

    </div>
  )
}
