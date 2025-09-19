// Helper functions for displaying frequency and schedule information

export function formatFrequencyDisplay(frequency: string, scheduleDays?: number[]): string {
  if (frequency === 'daily') return 'Daily'
  if (frequency === 'weekly') return 'Weekly'
  if (frequency === 'bi-weekly') return 'Bi-weekly'
  if (frequency === 'monthly') return 'Monthly'
  
  if (frequency === 'custom' && scheduleDays && scheduleDays.length > 0) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const selectedDays = scheduleDays.map(day => dayNames[day]).join(', ')
    
    // If all days selected, show as "Daily"
    if (scheduleDays.length === 7) {
      return 'Daily'
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
    return selectedDays
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
