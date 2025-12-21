'use client'

import React, { useEffect, useState } from 'react'
import TimelineView, { type Period as TVPeriod } from './TimelineView'
import PeriodList, { type Period as ListPeriod } from './PeriodList'
import PeriodModal, { type Period as ModalPeriod } from './PeriodModal'

type Period = TVPeriod & ListPeriod

export default function SupplementTimeline({
  supplementId,
  supplementName
}: {
  supplementId: string
  supplementName?: string
}) {
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editing, setEditing] = useState<Period | null>(null)
  const [error, setError] = useState<string>('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/supplements/${encodeURIComponent(supplementId)}/periods`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load periods')
      setPeriods(json.periods || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load periods')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplementId])

  const handleOpenAdd = () => {
    setEditing(null)
    setShowModal(true)
  }

  const handleEdit = (p: Period) => {
    setEditing(p)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setEditing(null)
  }

  const handleSave = async (data: ModalPeriod) => {
    const method = editing ? 'PATCH' : 'POST'
    const url = `/api/supplements/${encodeURIComponent(supplementId)}/periods`
    const payload = editing ? { ...data, periodId: editing.id } : data
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json?.error || 'Failed to save')
      return
    }
    await load()
    handleClose()
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/supplements/${encodeURIComponent(supplementId)}/periods`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodId: id })
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json?.error || 'Failed to delete')
      return
    }
    await load()
    handleClose()
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-900">{supplementName || 'Supplement'} — Timeline</h3>
        <button onClick={handleOpenAdd} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50">
          + Add Period
        </button>
      </div>
      {error && <div className="mb-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      {loading ? (
        <div className="h-10 animate-pulse rounded bg-zinc-100" />
      ) : (
        <>
          <div className="mb-3 overflow-x-auto">
            <div className="min-w-[640px]">
							<TimelineView periods={periods} onEdit={handleEdit} months={12} />
            </div>
          </div>
          <PeriodList periods={periods} onEdit={handleEdit} />
        </>
      )}

      <PeriodModal
        open={showModal}
        period={editing || undefined}
        onClose={handleClose}
        onSave={handleSave}
        onDelete={editing?.id ? handleDelete : undefined}
      />
    </div>
  )
}


