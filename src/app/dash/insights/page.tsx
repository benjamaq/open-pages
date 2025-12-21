export default async function InsightsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold">Truth Report</h1>
      <p className="mt-1 text-neutral-600">Your longitudinal insights across supplements.</p>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="rounded-2xl border bg-white p-5">Top wins (last 30d)</section>
        <section className="rounded-2xl border bg-white p-5">Keep / Drop / Test counts</section>
        <section className="rounded-2xl border bg-white p-5">Confidence growth</section>
      </div>
      <div className="mt-6 rounded-2xl border bg-white p-5">Correlations (sleep/HRV/RHR)</div>
    </div>
  )
}


