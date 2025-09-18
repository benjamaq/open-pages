'use client'

import { useState, useEffect } from 'react'

interface PublicProfileHeaderProps {
  profile: any
  isOwnProfile: boolean
}

export default function PublicProfileHeader({ profile, isOwnProfile }: PublicProfileHeaderProps) {
  const [dailyCheckIn, setDailyCheckIn] = useState<{energy: number, mood: string} | null>(null)

  useEffect(() => {
    if (isOwnProfile) {
      loadDailyCheckIn()
      
      // Set up interval to check for updates
      const interval = setInterval(loadDailyCheckIn, 3000)
      return () => clearInterval(interval)
    }
  }, [isOwnProfile])

  const loadDailyCheckIn = () => {
    const saved = localStorage.getItem('biostackr_last_daily_checkin')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        const today = new Date().toISOString().split('T')[0]
        
        if (data.date === today) {
          setDailyCheckIn({
            energy: data.energy,
            mood: data.mood
          })
        }
      } catch (error) {
        console.error('Error loading daily check-in:', error)
      }
    }
  }

  const getEnergyLabel = (energy: number) => {
    if (energy <= 2) return "Empty"
    if (energy <= 4) return "Low"
    if (energy <= 6) return "Stable"
    if (energy <= 8) return "Charged"
    return "Full"
  }

  return (
    <div className="flex flex-wrap justify-center lg:justify-start gap-2">
      <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium" style={{ color: '#5C6370' }}>
        Today
      </div>
      
      {/* Daily Check-in Display - Combined Pill */}
      {dailyCheckIn ? (
        <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium" style={{ color: '#5C6370' }}>
          🔋 {dailyCheckIn.energy}/10{dailyCheckIn.mood && ` • ${dailyCheckIn.mood}`}
        </div>
      ) : (
        <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium" style={{ color: '#5C6370' }}>
          🔋 7/10
        </div>
      )}
    </div>
  )
}
