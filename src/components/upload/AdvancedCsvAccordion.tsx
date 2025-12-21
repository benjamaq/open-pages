'use client'
import { useState } from 'react'
import CsvSchemaReference from '@/components/upload/CsvSchemaReference'

export default function AdvancedCsvAccordion() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-6">
      <button
        type="button"
        className="text-sm text-slate-700 underline underline-offset-4 hover:text-slate-900"
        onClick={() => setOpen(!open)}
      >
        {open ? 'Hide advanced CSV options' : 'Using a custom CSV?'}
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <CsvSchemaReference />
        </div>
      )}
    </div>
  )
}


