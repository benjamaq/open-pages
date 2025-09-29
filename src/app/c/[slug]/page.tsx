import { getCompound } from "@/data/compounds"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-static"

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const compound = getCompound(params.slug)
  if (!compound) return {}
  
  return {
    title: `${compound.name} — real stacks and common setup | BioStackr`,
    description: `${compound.name}: ${compound.heroNote} · See how real users run it (dose, timing, brands).`,
  }
}

export default function CompoundPage({ params }: { params: { slug: string } }) {
  const compound = getCompound(params.slug)
  if (!compound) return notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/" className="text-sm text-gray-500">← Back</Link>

      <h1 className="text-2xl font-bold mt-3 flex items-center gap-2">
        <span className="text-3xl">{compound.icon ?? "🧪"}</span>
        {compound.name}
      </h1>

      <p className="mt-2 text-gray-700">{compound.heroNote}</p>

      <ul className="mt-4 text-sm text-gray-700 list-disc pl-5 space-y-1">
        {compound.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Stacks using this</h2>
        <div className="space-y-3">
          {compound.stacks.map(s => (
            <div key={s.handle} className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <div className="font-medium">{s.displayName}</div>
                {s.blurb && <div className="text-sm text-gray-600">{s.blurb}</div>}
                <div className="text-xs text-gray-500 mt-1">{s.url.replace(/^https?:\/\//, "")}</div>
              </div>
              <Link href={s.url} className="text-blue-600 text-sm">View profile →</Link>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 text-sm text-gray-500">
        *This page is a simple snapshot to help you explore real setups. Always tailor doses with your clinician and labs.
      </div>
    </div>
  )
}
