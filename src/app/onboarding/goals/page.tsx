import { redirect } from 'next/navigation'

export default function LegacyGoalsRedirect() {
  redirect('/onboarding/upload')
}
