import CompoundCard from "./CompoundCard"
import { COMPOUNDS } from "@/data/compounds"

export default function CompoundGrid() {
  return (
    <section className="mt-12">
      <h3 className="text-lg font-semibold mb-3">
        How people actually use these (from public examples)
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Browse real public pages to see form, dose, timing, and notes. No advice—just examples you can copy.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COMPOUNDS.map(c => (
          <CompoundCard key={c.slug} slug={c.slug} name={c.name} heroNote={c.heroNote} icon={c.icon} />
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Looking for more? Start at the Examples page—each card links to real public pages. A full directory is coming soon.
        </p>
      </div>
    </section>
  )
}
