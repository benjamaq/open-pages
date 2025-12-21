import type { InsightItem } from './SalvinaSummary'

export default function InsightFeed({ items }: { items: InsightItem[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4">
      <div className="text-base font-semibold mb-3">Full Insight Feed</div>
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.id} className="p-3 rounded-lg border border-gray-100 bg-white">
            <div className="text-sm text-gray-800">{i.text}</div>
            <div className="text-xs text-gray-500 mt-1">{i.confidenceSource ?? 'Confidence grows with more data.'}</div>
            <div className="text-[11px] text-gray-400 mt-1">{new Date(i.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}






