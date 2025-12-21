'use server'

import { redirect } from 'next/navigation'

export default async function LegacyOldDashboard() {
  // Keep the old dash available via /legacy/old-dashboard
  redirect('/dash')
}






