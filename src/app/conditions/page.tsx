'use server'

import { redirect } from 'next/navigation'

export default async function ConditionsEntry() {
  // Facade route for legacy conditions product — no behavior change
  redirect('/patterns')
}


