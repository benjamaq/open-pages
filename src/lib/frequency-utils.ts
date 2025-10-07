// Helper functions for displaying frequency and schedule information

export function formatFrequencyDisplay(frequency: string, scheduleDays?: number[]): string {
  if (frequency === 'daily') return 'Daily'
  if (frequency === 'weekly') return 'Weekly'
  if (frequency === 'bi-weekly') return 'Bi-weekly'
  if (frequency === 'monthly') return 'Monthly'
  
  if (frequency === 'custom') {
    // Custom scheduling should always show as "Custom" regardless of day selection
    // The user chose "custom" which means they'll decide when to take it
    return 'Custom'
  }
  
  return frequency || 'As needed'
}

export function formatScheduleDays(scheduleDays: number[]): string {
  if (!scheduleDays || scheduleDays.length === 0) return 'As needed'
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // If all days selected
  if (scheduleDays.length === 7) {
    return 'Every day'
  }
  
  // If weekdays only (Mon-Fri)
  if (scheduleDays.length === 5 && scheduleDays.every(day => day >= 1 && day <= 5)) {
    return 'Weekdays'
  }
  
  // If weekends only (Sat-Sun)
  if (scheduleDays.length === 2 && scheduleDays.includes(0) && scheduleDays.includes(6)) {
    return 'Weekends'
  }
  
  // Otherwise show the specific days
  return scheduleDays.map(day => dayNames[day]).join(', ')
}
