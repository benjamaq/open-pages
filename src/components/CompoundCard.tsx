"use client"
import Link from "next/link"

// Map compound slugs to their examples page anchors
const getExamplesLink = (slug: string) => {
  const linkMap: Record<string, string> = {
    'creatine': '/examples#creatine',
    'magnesium-glycinate': '/examples#magnesium',
    'omega-3': '/examples#omega3',
    'vitamin-d3': '/examples#vitamin-d3',
    'berberine': '/examples#berberine',
    'ashwagandha': '/examples#ashwagandha'
  }
  return linkMap[slug] || `/examples#${slug}`
}

export default function CompoundCard({
  slug, name, heroNote, icon,
}: { slug: string; name: string; heroNote: string; icon?: string }) {
  return (
    <Link
      href={getExamplesLink(slug)}
      className="block rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition"
    >
      <div className="text-2xl mb-2">{icon ?? "🧪"}</div>
      <div className="font-semibold">{name}</div>
      <div className="text-sm text-gray-600 mt-1">{heroNote}</div>
      <div className="mt-3 text-sm text-blue-600">See examples →</div>
    </Link>
  )
}
