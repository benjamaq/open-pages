'use client'

import AddSupplementButton from '@/components/dashboard/AddSupplementButton'
import StatusBadge from '@/components/ui/StatusBadge'

export default function SupplementsHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Your Stack</h2>
      </div>
      <div className="flex items-center gap-3">
        {/* Legend chips */}
        <div className="hidden md:flex items-center gap-2">
          <StatusBadge variant="proven">Proven</StatusBadge>
          <StatusBadge variant="testing">Testing</StatusBadge>
          <StatusBadge variant="confounded">Confounded</StatusBadge>
          <StatusBadge variant="collecting">Collecting</StatusBadge>
        </div>
        <AddSupplementButton onOpen={onAdd} />
      </div>
    </div>
  )
}


