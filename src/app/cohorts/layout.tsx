import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BioStackr for Brands — Real-World Cohort Studies for Supplement Brands',
  description: 'Turn your existing customers into credible marketing evidence. BioStackr runs real-world cohort studies and delivers claim-ready results in under 10 weeks.',
  openGraph: {
    title: 'BioStackr for Brands — Real-World Cohort Studies for Supplement Brands',
    description: 'Turn your existing customers into credible marketing evidence. BioStackr runs real-world cohort studies and delivers claim-ready results in under 10 weeks.',
  },
}

export default function CohortsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
