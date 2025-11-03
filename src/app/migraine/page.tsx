import type { Metadata } from 'next'
import MigraineLandingClient from './MigraineLandingClient'

export const metadata: Metadata = {
  title: "Migraine Trigger Tracker | Find What's Triggering Your Migraines | BioStackr",
  description:
    "Track in 20 seconds a day. BioStackr's intelligent system finds patterns linked to your migraines—including combos and 24–48h lags. Start free; see insights in 5–7 days.",
  keywords: [
    'migraine tracker',
    'migraine triggers',
    'aura',
    'hormonal migraine',
    'barometric pressure',
    'weather migraine',
    'caffeine withdrawal',
    'sleep deprivation',
    'combination triggers',
    'migraine diary',
  ],
  openGraph: {
    title: 'Finally Understand What Triggers Your Migraines',
    description:
      'AI finds combination triggers and 24-48h lag patterns. Track in 20 seconds daily.',
    images: ['/images/migraine-og.png'],
  },
}

export default function Page() {
  return <MigraineLandingClient />
}


