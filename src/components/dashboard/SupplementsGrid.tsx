import { useEffect, useMemo, useState } from 'react'
import { SupplementCard } from './SupplementCard'
import { type SupplementCardData, mapPurposeTag } from '@/lib/supplements/types'
import SupplementDetailsModal from '@/components/modals/SupplementDetailsModal'

type Supplement = {
  id: string
  name: string
  dose?: string
  monthlyCost?: number | null
  monthly_cost_usd?: number | null
  periods: Array<{ id?: string; startDate: string; endDate: string | null; note?: string | null }>
  // New API fields
  effectPct?: number | null
  confidence?: number | null
  n?: number | null
  metric?: string | null
  status?: 'working' | 'likely_working' | 'testing' | 'not_helping'
  ui?: {
    status?: string
    badge?: string
    borderColor?: string
    barColor?: string
    bgColor?: string
    badgeBg?: string
  } | null
  // Legacy signal fallback
  signal?: { n: number; effectPct?: number | null; confidence: number; status: 'insufficient'|'testing'|'confirmed'|'no_effect' }
}

type FilterStatus = 'all' | 'working' | 'testing' | 'not_working'
type SortOption = 'confidence' | 'az' | 'cost' | 'days'

type Props = {
  supplements: Supplement[]
  onAddClick: () => void
  onViewTimeline: (id: string) => void
  onEdit: (id: string) => void
  onArchive: (id: string) => void
  showControls?: boolean
}

export default function SupplementsGrid({
  supplements,
  onAddClick,
  onViewTimeline,
  onEdit,
  onArchive,
  showControls = false
}: Props) {
  // Keep a local copy to optimistically update periods/info
  const [data, setData] = useState<Supplement[]>(supplements)
  useEffect(() => { setData(supplements) }, [supplements])

  const [selected, setSelected] = useState<Supplement | null>(null)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [sort, setSort] = useState<SortOption>('confidence')

  function isWorkingItem(s: Supplement): boolean {
    return s.status === 'working'
  }
  function isLikelyWorkingItem(s: Supplement): boolean {
    return s.status === 'likely_working'
  }
  function isTestingItem(s: Supplement): boolean {
    return s.status === 'testing'
  }
  function isNotHelpingItem(s: Supplement): boolean {
    return s.status === 'not_helping'
  }
  
  // Normalize items with missing status to 'testing' so they appear under Still Testing
  const normalized = useMemo(() => data.map(s => (s.status ? s : { ...s, status: 'testing' as any })), [data])

  const filtered = normalized.filter(s => {
    // Exclude obvious test items by name (display-only)
    const nm = (s.name || '').trim().toLowerCase()
    const isTest = ['fff','tt','dd','ee','c'].includes(nm) || nm === 'test' || nm.startsWith('test ')
    if (isTest) return false
    if (!s.status) return filter === 'all'
    if (filter === 'all') return true
    if (filter === 'working') return isWorkingItem(s)
    if (filter === 'testing') return isTestingItem(s)
    if (filter === 'not_working') return isNotHelpingItem(s)
    return true
  })
  
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'az') return a.name.localeCompare(b.name)
    if (sort === 'confidence') return ((b.confidence ?? b.signal?.confidence ?? 0) as number) - ((a.confidence ?? a.signal?.confidence ?? 0) as number)
    return 0
  })
  
  const confirmedCount = data.filter(s => isWorkingItem(s)).length
  // Potential savings from 'not_helping'
  const savingsList = data.filter(s => isNotHelpingItem(s) && ((s.monthly_cost_usd ?? s.monthlyCost ?? 0) as number) > 0)
  const droppedSavings = savingsList.reduce((acc, s) => acc + Number(s.monthly_cost_usd ?? s.monthlyCost ?? 0), 0)
  const sections = [
    { key: 'working', title: '✅ Confirmed Winners', filter: (s: Supplement) => isWorkingItem(s) },
    { key: 'likely', title: '📈 Looking Promising', filter: (s: Supplement) => isLikelyWorkingItem(s) },
    { key: 'testing', title: '🔍 Still Testing', filter: (s: Supplement) => isTestingItem(s) },
    { key: 'not', title: '❌ Not Helping', filter: (s: Supplement) => isNotHelpingItem(s) },
  ] as const
  // collapse "Still Testing" if too many
  const testingItems = sorted.filter(sections[2].filter)
  const collapseTesting = testingItems.length >= 10
  const [testingOpen, setTestingOpen] = useState(!collapseTesting)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Savings banner (only when we have real values) */}
      {droppedSavings > 0 && (
        <div className="mb-4 rounded-xl border-2 border-green-500 bg-green-50 p-4 flex items-center justify-between">
          <div className="text-sm text-green-800">
            <div className="text-lg font-bold">💰 Savings Opportunity: ${droppedSavings}/month</div>
            <div>{savingsList.length} supplements not helping you</div>
          </div>
          <div className="text-sm text-green-700">Review in details →</div>
        </div>
      )}
      
      {showControls && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-2">
            {(['all', 'working', 'testing', 'not_working'] as FilterStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {status === 'all' ? 'All' : status === 'working' ? 'Working' : status === 'testing' ? 'Testing' : 'Not Working'}
              </button>
            ))}
          </div>
          
          <div className="ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="confidence">Confidence (high first)</option>
              <option value="az">A → Z</option>
              <option value="cost">Cost (high to low)</option>
              <option value="days">Days active</option>
            </select>
          </div>
        </div>
      )}
      
      {sorted.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No supplements yet' : `No ${filter} supplements`}
          </h3>
          <p className="text-gray-600 mb-6">Click the + button to add your first supplement</p>
        </div>
      )}
      
      {sections.map((sec, idx) => {
        const items = idx === 2 ? testingItems : sorted.filter(sec.filter as any)
        if (items.length === 0) return null
        const isTesting = idx === 2
        return (
          <section key={sec.key} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800">{sec.title} · {items.length}</h4>
              {isTesting && collapseTesting && (
                <button className="text-xs text-gray-600 hover:text-gray-800 underline" onClick={() => setTestingOpen(v => !v)}>
                  {testingOpen ? 'Collapse' : 'Expand'}
                </button>
              )}
            </div>
            {(!isTesting || testingOpen) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {items.map((supplement) => {
                  const purposes: string[] = []
                  try {
                    const tags = (supplement as any)?.primary_goal_tags as string[] | undefined
                    if (Array.isArray(tags)) purposes.push(...tags.map(t => mapPurposeTag(t)))
                  } catch {}
                  const card: SupplementCardData = {
                    id: String(supplement.id),
                    name: String(supplement.name || 'Supplement'),
                    doseDisplay: String((supplement as any).dose || ''),
                    purposes,
                    timeOfDayLabel: undefined,
                    frequencyLabel: undefined,
                    contextLabel: undefined,
                    daysTrackedLastWindow: Number((supplement as any).daysOfData ?? 0),
                    daysRequiredForInsight: Number((supplement as any).requiredDays ?? 14),
                    lastCheckInDate: undefined,
                    insightState: 'collecting_baseline',
                    effectDirection: 'neutral',
                    effectDimension: undefined,
                    memberHasDeeperAnalysis: false,
                    hasTruthReport: false,
                    isMember: true
                  }
                  return (
                    <SupplementCard
                      key={supplement.id}
                      data={card}
                      onClick={() => setSelected(supplement as any) || setOpen(true)}
                    />
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
      
      <button
        onClick={onAddClick}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl shadow-blue-500/50 hover:scale-110 hover:shadow-blue-500/70 active:scale-95 transition-all duration-200 flex items-center justify-center z-50"
        aria-label="Add supplement"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Details modal */}
      {selected && (
        <>
          {console.log('🎨 GRID MODAL RENDERING', { open, selectedName: (selected as any).name })}
          <SupplementDetailsModal
            open={open}
            onClose={() => setOpen(false)}
            supplement={selected as any}
            onSaveInfo={async (payload) => {
            // TODO: wire PATCH /api/supplements/:id when available
            setData(prev => prev.map(s => s.id === payload.id ? { ...s, ...payload } as Supplement : s))
            }}
            onCreatePeriod={async (sid, p) => {
            await fetch(`/api/supplements/${sid}/periods`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ start_date: p.start, end_date: p.end ?? null, notes: p.note ?? null })
            })
            }}
            onUpdatePeriod={async (sid, p) => {
            await fetch(`/api/supplements/${sid}/periods`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ periodId: p.id, start_date: p.start, end_date: p.end ?? null, notes: p.note ?? null })
            })
            }}
            onDeletePeriod={async (sid, periodId) => {
            await fetch(`/api/supplements/${sid}/periods`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ periodId })
            })
            }}
          />
        </>
      )}
    </div>
  )
}


