'use client'

export default function ElliStrip({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3 flex items-start gap-3">
      <div className="h-8 w-8 rounded-full bg-indigo-600 text-white grid place-items-center text-sm font-semibold">E</div>
      <div className="text-sm text-slate-800">
        {message}
      </div>
    </div>
  )
}





