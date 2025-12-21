'use client'

export default function MicroWinsStrip({ streakDays, totalCheckins, daysUntilFirstMilestone }: { streakDays: number; totalCheckins: number; daysUntilFirstMilestone: number }) {
  return (
    <section
      className="rounded-2xl shadow-sm p-6"
      style={{
        border: '1px solid transparent',
        background:
          'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(180deg, rgba(2,6,23,0.08), rgba(255,255,255,0)) border-box'
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Item label="Streak" value={streakDays > 0 ? `${streakDays}-day streak` : 'No streak yet'}>
          <Ring percent={Math.max(0, Math.min(100, Math.round(((streakDays % 7) / 7) * 100)))} />
        </Item>
        <Item label="Check-ins logged" value={`${totalCheckins}`}>
          <Ring percent={Math.max(0, Math.min(100, Math.round((Math.min(totalCheckins, 30) / 30) * 100)))} />
        </Item>
        <Item label="Next milestone" value={milestoneText(daysUntilFirstMilestone)}>
          <Ring percent={Math.max(0, Math.min(100, Math.round(((7 - Math.max(0, daysUntilFirstMilestone || 0)) / 7) * 100)))} />
        </Item>
      </div>
    </section>
  )
}

function Item({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-3 transition hover:-translate-y-[1px]"
      style={{
        border: '1px solid transparent',
        background:
          'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(180deg, rgba(2,6,23,0.08), rgba(255,255,255,0)) border-box',
        boxShadow: '0 1px 0 rgba(15,23,42,0.04)'
      }}
    >
      <div className="flex items-center gap-3">
        {children}
        <div>
          <div className="text-[10px] uppercase tracking-wide" style={{ color: '#6B7280' }}>{label}</div>
          <div className="text-xl font-semibold leading-6" style={{ color: '#1F2937' }}>{value}</div>
        </div>
      </div>
      <div className="text-[10px]" style={{ color: '#6B7280' }}> </div>
    </div>
  )
}

function milestoneText(days: number) {
  if (!days || days <= 0) return 'Weekly insight locked — keep checking in'
  if (days === 1) return '1 day until your first weekly insight'
  return `${days} days until your first weekly insight`
}

function Ring({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent))
  const r = 14
  const c = 2 * Math.PI * r
  const off = c - (p / 100) * c
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="4" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="#3B6EF6"
        strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
    </svg>
  )
}


