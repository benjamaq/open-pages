'use client'

interface ProtocolCardProps {
  name: string
  frequency?: string
  note?: string
}

export default function ProtocolCard({ name, frequency, note }: ProtocolCardProps) {
  return (
    <div className="rounded-xl border bg-card hover:shadow-sm transition-shadow p-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-card-foreground line-clamp-2">
          {name}
        </h3>
        
        <div className="flex items-center gap-2">
          {frequency && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-foreground/70 font-medium">
              {frequency}
            </span>
          )}
        </div>
        
        {note && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {note}
          </p>
        )}
      </div>
    </div>
  )
}
