type Experiment = {
  id: string;
  title: string;     // "Magnesium → Sleep"
  day: number;       // 1..7
  deltaPct?: number; // +9 / -3
  n: number;
  confidence: number;
};

export function ExperimentsStrip({ items }: { items: Experiment[] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-4 flex items-center justify-between">
        <div className="text-sm text-zinc-700">
          <span className="font-medium">No active test.</span> Run a 7-day protocol to see real effects.
        </div>
        <button className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm hover:opacity-90">Start 7-day test</button>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {items.map(x => (
        <div key={x.id} className="min-w-[280px] rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{x.title}</div>
            <div className="text-[11px] text-zinc-500">Day {x.day}/7</div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[12px]">
            {typeof x.deltaPct === 'number' && (
              <span className={x.deltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                ∆ {x.deltaPct >= 0 ? '+' : ''}{x.deltaPct}%</span>
            )}
            <span className="text-zinc-600">· n={x.n} · Conf {x.confidence}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-zinc-100">
            <div className="h-full bg-zinc-900/80 transition-all" style={{ width: `${(x.day/7)*100}%` }} />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">Pause</button>
            <button className={`px-3 py-1.5 rounded-lg text-sm ${x.day>=7 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-800'}`}>
              {x.day>=7 ? 'End & get verdict' : 'Details'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}


