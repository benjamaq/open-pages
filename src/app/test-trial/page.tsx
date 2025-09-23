'use client'

import { useState, useEffect } from 'react'

interface TrialData {
  tier: string
  isInTrial: boolean
  trialStartedAt: string | null
  trialEndedAt: string | null
}

export default function TestTrialPage() {
  const [trialData, setTrialData] = useState<TrialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadTrialData()
  }, [])

  const loadTrialData = async () => {
    try {
      const response = await fetch('/api/trial')
      if (response.ok) {
        const data = await response.json()
        setTrialData(data)
      } else {
        setMessage('Failed to load trial data')
      }
    } catch (error) {
      console.error('Error loading trial data:', error)
      setMessage('Error loading trial data')
    } finally {
      setLoading(false)
    }
  }

  const startTrial = async () => {
    try {
      const response = await fetch('/api/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_trial' })
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessage(data.message)
        loadTrialData() // Reload data
      } else {
        const error = await response.json()
        setMessage(error.error)
      }
    } catch (error) {
      console.error('Error starting trial:', error)
      setMessage('Error starting trial')
    }
  }

  const endTrial = async () => {
    try {
      const response = await fetch('/api/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end_trial' })
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessage(data.message)
        loadTrialData() // Reload data
      } else {
        const error = await response.json()
        setMessage(error.error)
      }
    } catch (error) {
      console.error('Error ending trial:', error)
      setMessage('Error ending trial')
    }
  }

  if (loading) {
    return <div className="p-8">Loading trial data...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Trial Status Test</h1>
      
      {message && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {message}
        </div>
      )}

      {trialData && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Current Status</h2>
            <div className="space-y-2">
              <div><strong>Tier:</strong> {trialData.tier}</div>
              <div><strong>In Trial:</strong> {trialData.isInTrial ? 'Yes' : 'No'}</div>
              {trialData.trialStartedAt && (
                <div><strong>Trial Started:</strong> {new Date(trialData.trialStartedAt).toLocaleString()}</div>
              )}
              {trialData.trialEndedAt && (
                <div><strong>Trial Ends:</strong> {new Date(trialData.trialEndedAt).toLocaleString()}</div>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={startTrial}
              disabled={trialData.isInTrial}
              className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start 14-Day Trial
            </button>
            
            <button
              onClick={endTrial}
              disabled={!trialData.isInTrial}
              className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              End Trial
            </button>
            
            <button
              onClick={loadTrialData}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>First, run the SQL migration in Supabase to add trial columns</li>
          <li>Use the buttons above to test trial status changes</li>
          <li>Check the settings page to see if the trial status displays correctly</li>
        </ol>
      </div>
    </div>
  )
}

