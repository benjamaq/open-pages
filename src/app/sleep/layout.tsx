import type { Metadata } from 'next'

export const metadata: Metadata = {
  manifest: '/sleep-manifest.json',
  appleWebApp: {
    title: 'BioStackr Sleep',
    capable: true,
  },
}

export default function SleepLayout({ children }: { children: React.ReactNode }) {
  return children as any
}


