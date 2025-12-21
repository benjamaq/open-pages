import { redirect } from 'next/navigation'

export default function LegacyPrioritiesRedirect() {
  redirect('/onboarding/upload')
}
