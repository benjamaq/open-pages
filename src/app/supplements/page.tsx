'use server'

import { redirect } from 'next/navigation'

export default async function SupplementsEntry() {
  // Facade route for new supplements product — no behavior change
  redirect('/dash')
}


