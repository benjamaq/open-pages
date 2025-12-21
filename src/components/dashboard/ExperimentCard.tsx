import React from 'react'

type Experiment = {
  id: string
  name: string
  hypothesis: string
  startDate: string
  duration: number
  daysElapsed: number
  checkInsCompleted: number
  checkInsRequired: number
  status: 'active' | 'completed' | 'ended'
}

export function ExperimentCard({ experiment }: { experiment: Experiment }) {
  const timeProgress = (experiment.daysElapsed / experiment.duration) * 100
  const checkInProgress = (experiment.checkInsCompleted / experiment.checkInsRequired) * 100
  const daysRemaining = experiment.duration - experiment.daysElapsed
  const checkInsRemaining = experiment.checkInsRequired - experiment.checkInsCompleted
  const nearEnd = daysRemaining <= 2 && daysRemaining > 0
  const early = experiment.daysElapsed <= 3
  
  function statusLine() {
    if (checkInsRemaining > 0) {
      if (nearEnd) return 'Almost there — final check-ins will confirm your trend.'
      if (early) return 'Still calibrating — you’ll see movement after Day 3.'
      return `Tracking steady — ${checkInsRemaining} more check-ins before verdict.`
    }
    if (timeProgress < 100) return `Check-ins complete! Keep taking for ${Math.max(0, daysRemaining)} more days`
    return 'Experiment complete — analyzing your results...'
  }
  
  return (
    <div className="bg-white rounded-lg border-2 border-purple-400 shadow-sm hover:shadow-md transition-all p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔬</span>
          <div>
            <div className="text-[10px] font-bold tracking-wider text-purple-600">EXPERIMENT</div>
            <div className="text-base font-semibold text-gray-900">
              Day {experiment.daysElapsed}/{experiment.duration}
            </div>
          </div>
        </div>
        <div className="text-xs font-medium text-gray-500">
          {daysRemaining}d left
        </div>
      </div>
      
      <div className="text-sm font-medium text-gray-800 mb-3 leading-snug">
        {experiment.hypothesis}
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700 ease-out animate-pulse"
            style={{ width: `${Math.max(0, Math.min(100, timeProgress))}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>{experiment.checkInsCompleted}/{experiment.checkInsRequired} check-ins</span>
          <span>{Math.round(timeProgress)}%</span>
        </div>
      </div>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-3">
        <p className="text-xs text-purple-800 m-0 font-medium">
          {statusLine()}
        </p>
      </div>
      
      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 transition-colors">
          Details
        </button>
        <button className="flex-1 px-3 py-2 bg-yellow-50 hover:bg-yellow-100 border border-yellow-400 rounded-lg text-xs font-semibold text-yellow-800 transition-colors">
          End
        </button>
      </div>
    </div>
  )
}


