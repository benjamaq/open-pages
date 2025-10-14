// Onboarding state management and utilities

export interface OnboardingState {
  isCompleted: boolean
  currentStep: number
  firstCheckinCompleted: boolean
  firstSupplementAdded: boolean
  profileCreated: boolean
  publicPageViewed: boolean
}

export const ONBOARDING_STEPS = {
  FIRST_CHECKIN: 1,
  FIRST_SUPPLEMENT: 2,
  CREATE_PROFILE: 3,
  VIEW_PUBLIC_PAGE: 4
} as const

export function getOnboardingProgress(profile: any): OnboardingState {
  return {
    isCompleted: profile?.onboarding_completed || false,
    currentStep: profile?.onboarding_step || 1,
    firstCheckinCompleted: profile?.first_checkin_completed || false,
    firstSupplementAdded: profile?.first_supplement_added || false,
    profileCreated: profile?.profile_created || false,
    publicPageViewed: profile?.public_page_viewed || false
  }
}

export function shouldShowOnboarding(profile: any): boolean {
  // Show onboarding if steps 1-2 are not completed (mandatory)
  return !profile?.first_checkin_completed || !profile?.first_supplement_added
}

/**
 * Determine if user needs NEW orchestrated onboarding flow
 * (with category selection BEFORE check-in)
 */
export function needsOrchestratedOnboarding(profile: any): boolean {
  // User needs orchestrated onboarding if:
  // 1. They haven't completed first check-in, OR
  // 2. They don't have a tone_profile set (even if they completed check-in)
  // This ensures all users get the new flow with proper tone-aware messaging
  return !profile?.first_checkin_completed || !profile?.tone_profile;
}

export function shouldShowProfileBanner(profile: any): boolean {
  // Show banner if steps 1-2 are done but 3-4 are incomplete
  const mandatoryComplete = profile?.first_checkin_completed && profile?.first_supplement_added
  const optionalIncomplete = !profile?.profile_created || !profile?.public_page_viewed
  return mandatoryComplete && optionalIncomplete && !profile?.onboarding_completed
}

export function getNextOnboardingStep(profile: any): number {
  if (!profile?.first_checkin_completed) return 1
  if (!profile?.first_supplement_added) return 2
  if (!profile?.profile_created) return 3
  if (!profile?.public_page_viewed) return 4
  return 4 // All steps complete
}

export async function updateOnboardingStep(step: number, userId: string): Promise<void> {
  try {
    const response = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        onboarding_step: step,
        ...(step === 1 && { first_checkin_completed: true }),
        ...(step === 2 && { first_supplement_added: true }),
        ...(step === 3 && { profile_created: true }),
        ...(step === 4 && { public_page_viewed: true, onboarding_completed: true })
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update onboarding step')
    }
  } catch (error) {
    console.error('Error updating onboarding step:', error)
    throw error
  }
}

export function getOnboardingBannerMessage(profile: any): string | null {
  // Mandatory steps 1-2
  if (shouldShowOnboarding(profile)) {
    const step = getNextOnboardingStep(profile)
    switch (step) {
      case 1:
        return "Complete your first check-in to get started"
      case 2:
        return "Add your first supplement to build your stack"
      default:
        return null
    }
  }
  
  // Optional steps 3-4
  if (shouldShowProfileBanner(profile)) {
    return "Complete your profile to share your journey with others"
  }
  
  return null
}

export function getOnboardingBannerAction(profile: any): string {
  if (shouldShowOnboarding(profile)) {
    const step = getNextOnboardingStep(profile)
    switch (step) {
      case 1:
        return "Start Check-In"
      case 2:
        return "Add Supplement"
      default:
        return "Continue Setup"
    }
  }
  
  if (shouldShowProfileBanner(profile)) {
    return "Complete Profile"
  }
  
  return "Complete Setup"
}
