'use client'

import { useState, useEffect } from 'react'
import JournalSection from './JournalSection'
import SupplementsSection from './SupplementsSection'
import ProtocolsSection from './ProtocolsSection'
import MovementSection from './MovementSection'
import MindfulnessSection from './MindfulnessSection'
import FilesSection from './FilesSection'
import SectionToggleSheet from './SectionToggleSheet'
import { updateJournalVisibility } from '../lib/actions/profile'
import { type PublicModules } from '../lib/actions/public-modules'

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
  publicUploads: any[]
  publicJournalEntries: JournalEntry[]
  publicModules: PublicModules
  isOwnProfile: boolean
}

export default function PublicProfileClient({
  profile,
  publicSupplements,
  publicProtocols,
  publicMovement,
  publicMindfulness,
  publicUploads,
  publicJournalEntries,
  publicModules,
  isOwnProfile
}: PublicProfileClientProps) {
  const [showJournalPublic, setShowJournalPublic] = useState(profile.show_journal_public || false)
  const [currentModules, setCurrentModules] = useState<PublicModules>(publicModules || {
    supplements: true,
    protocols: true,
    movement: true,
    mindfulness: true,
    food: true,
    uploads: true,
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
      {/* Customization Controls (Owner Only) */}
      {isOwnProfile && (
        <div className="flex justify-end mb-6">
          <SectionToggleSheet 
            currentModules={currentModules}
            onUpdate={handleModulesUpdate}
          />
        </div>
      )}


      {/* Journal section */}
      {(currentModules?.journal && (publicJournalEntries.length > 0 || isOwnProfile)) && (
        <div id="journal">
          <JournalSection 
            journalEntries={publicJournalEntries} 
            showJournalPublic={showJournalPublic}
            onToggleVisibility={handleJournalVisibilityToggle}
            isOwnProfile={isOwnProfile}
            profileId={profile.id}
          />
        </div>
      )}
      
      {/* Other sections */}
      {currentModules?.supplements && publicSupplements.length > 0 && (
        <SupplementsSection supplements={publicSupplements} />
      )}
      
      {currentModules?.protocols && publicProtocols.length > 0 && (
        <ProtocolsSection protocols={publicProtocols} />
      )}
      
      {currentModules?.movement && publicMovement.length > 0 && (
        <MovementSection movementItems={publicMovement} />
      )}
      
      {currentModules?.mindfulness && publicMindfulness.length > 0 && (
        <MindfulnessSection mindfulnessItems={publicMindfulness} />
      )}
      
      {currentModules?.uploads && publicUploads.length > 0 && (
        <FilesSection uploads={publicUploads} />
      )}

      {/* Empty State - If no visible content */}
      {(!currentModules?.supplements || publicSupplements.length === 0) && 
       (!currentModules?.protocols || publicProtocols.length === 0) && 
       (!currentModules?.movement || publicMovement.length === 0) && 
       (!currentModules?.mindfulness || publicMindfulness.length === 0) && 
       (!currentModules?.uploads || publicUploads.length === 0) && 
       (!currentModules?.journal || publicJournalEntries.length === 0) && (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium mb-2" style={{ color: '#0F1115' }}>
              {isOwnProfile ? 'Customize Your Profile' : 'Profile Coming Soon'}
            </h3>
            <p className="text-sm" style={{ color: '#5C6370' }}>
              {isOwnProfile 
                ? 'Add content to your sections or enable them in the customization panel above.'
                : 'This profile is being set up. Check back soon!'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
