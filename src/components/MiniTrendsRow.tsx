'use client'

export default function MiniTrendsRow() {
  const items = [
    { title: 'Recovery trend', note: 'Last 3 days are edging above baseline.' },
    { title: 'Focus forecast', note: 'Tomorrow is pivotal — two up days can make three.' },
    { title: 'Energy rhythm', note: 'Afternoons look steadier this week.' },
    { title: 'Mood stability', note: 'Variability is settling — baseline forming.' }
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {items.map((i, idx) => (
        <div
          key={i.title}
          className="rounded-xl p-3 transition hover:-translate-y-[1px]"
          style={{
            border: '1px solid transparent',
            background:
              'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(180deg, rgba(2,6,23,0.08), rgba(255,255,255,0)) border-box',
            boxShadow: '0 1px 0 rgba(15,23,42,0.04)'
          }}
        >
          <Sparkline index={idx} />
          <div className="text-xs font-medium mt-2" style={{ color: '#1F2937' }}>{i.title}</div>
          <div className="text-xs mt-1" style={{ color: '#6B7280' }}>{i.note}</div>
        </div>
      ))}
    </div>
  )
}

function Sparkline({ index }: { index: number }) {
  // Simple, varied placeholder lines to add life (no data dependency)
  const gradients = [
    { from: '#3B6EF6', to: 'rgba(59,110,246,0.2)' },
    { from: '#10B981', to: 'rgba(16,185,129,0.2)' },
    { from: '#F59E0B', to: 'rgba(245,158,11,0.2)' },
    { from: '#6366F1', to: 'rgba(99,102,241,0.2)' }
  ]
  const g = gradients[index % gradients.length]
  return (
    <svg viewBox="0 0 160 40" width="100%" height="40" role="img" aria-label="trend">
      <defs>
        <linearGradient id={`g-${index}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={g.from} stopOpacity="0.35" />
          <stop offset="100%" stopColor={g.to} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`s-${index}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={g.from} />
          <stop offset="100%" stopColor={g.from} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path
        d={pathFor(index)}
        fill={`url(#g-${index})`}
      />
      <path
        d={lineFor(index)}
        fill="none"
        stroke={`url(#s-${index})`}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function lineFor(i: number) {
  // Four pleasant curves to avoid sameness
  if (i === 0) return 'M2,28 C22,18 42,22 62,16 C82,10 102,14 122,10 C142,6 156,14 158,12'
  if (i === 1) return 'M2,22 C20,26 40,18 60,24 C80,30 100,22 120,26 C140,30 150,24 158,26'
  if (i === 2) return 'M2,30 C20,20 40,28 60,18 C80,10 100,20 120,14 C140,10 150,16 158,12'
  return 'M2,24 C22,22 42,16 62,20 C82,24 102,18 122,22 C142,26 150,20 158,18'
}

function pathFor(i: number) {
  // Area under the line for softness
  const base = 36
  const l = lineFor(i)
  return `${l} L158,${base} L2,${base} Z`
}