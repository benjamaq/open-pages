'use client';

export function UploadWidget() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="text-sm font-semibold text-slate-900 mb-2">Update Your Data</div>
      <p className="text-sm text-slate-600 mb-4">Upload new wearable data to keep insights current.</p>
      <div className="flex flex-wrap gap-2">
        {['Oura', 'Whoop', 'Garmin', 'Fitbit', 'Other Device'].map(name => (
          <button key={name} className="px-3 py-2 text-sm rounded-md border border-slate-300 hover:bg-slate-50">{`Upload ${name}`}</button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3">Tip: Upload weekly for best results</p>
    </section>
  )
}




