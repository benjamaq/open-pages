import { createClient } from '@/lib/supabase/server'

export default async function SupplementsEffectivenessCard({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('elli_messages')
    .select('id, created_at, context')
    .eq('user_id', userId)
    .eq('message_type', 'insight')
    .filter('context->>insight_key', 'eq', 'supplement_effectiveness')
    .order('created_at', { ascending: false })
    .limit(1)

  const insight = (data as any[] | null)?.[0]?.context
  if (!insight) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
        <div className="text-sm text-gray-500">No supplement effectiveness insight yet.</div>
      </div>
    )
  }

  const { icon, topLine, discovery, action } = insight

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icon || '✅'}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">Supplement Effectiveness</div>
          {topLine && (
            <div className="font-semibold text-gray-900 text-base mb-1">{topLine}</div>
          )}
          {discovery && (
            <p className="text-sm text-gray-700 leading-relaxed mb-1">{discovery}</p>
          )}
          {action && (
            <p className="text-sm text-gray-900 font-semibold">{action}</p>
          )}
        </div>
      </div>
    </div>
  )
}


