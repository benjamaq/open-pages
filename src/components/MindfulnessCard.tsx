'use client'

interface MindfulnessCardProps {
  name: string
  duration?: string
  timing?: string
  notes?: string
}

export default function MindfulnessCard({ name, duration, timing, notes }: MindfulnessCardProps) {
  return (
    <div className="rounded-xl border bg-card hover:shadow-sm transition-shadow p-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-card-foreground line-clamp-2">
          {name}
        </h3>
        
        <div className="flex items-center gap-2 flex-wrap">
          {duration && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-foreground/70 font-medium">
              {duration}
            </span>
          )}
          {timing && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-foreground/70 font-medium">
              {timing}
            </span>
          )}
        </div>
        
        {notes && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {notes}
          </p>
        )}
      </div>
    </div>
  )
}
