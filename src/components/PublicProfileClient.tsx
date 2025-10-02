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
import PublicMoodSection from './PublicMoodSection'
import SectionToggleSheet from './SectionToggleSheet'
import OverviewSection from './OverviewSection'
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
  isSharedPublicLink
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

      {/* Journal section */}
      {(currentModules?.journal && (publicJournalEntries.length > 0 || (isOwnProfile && !isSharedPublicLink))) && (
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

      {/* Mood Tracker section */}
      {currentModules?.mood && publicMoodData.length > 0 && (
        <div id="mood" className="mb-8">
          <PublicMoodSection 
            moodData={publicMoodData}
            profileName={profile.display_name || 'this user'}
          />
        </div>
      )}
      
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
