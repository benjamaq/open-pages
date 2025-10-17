import { createClient } from '@/lib/supabase/server'

export default async function InsightsPanel({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: insights } = await supabase
    .from('elli_messages')
    .select('id, message_text, created_at')
    .eq('user_id', userId)
    .eq('message_type', 'insight')
    .order('created_at', { ascending: false })
    .limit(3)

  if (!insights || insights.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Pattern Insights</h3>
        <p className="text-sm text-gray-600">Not enough data yet. Track for a few days to unlock insights.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Pattern Insights</h3>
      {insights.map((insight) => (
        <div key={insight.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-gray-700">{insight.message_text}</p>
        </div>
      ))}
    </div>
  )
}


