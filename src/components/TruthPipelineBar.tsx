export interface PipelineCounts {
  hypothesis: number
  early: number
  validating: number
  proven: number
}

export default function TruthPipelineBar({ counts }: { counts: PipelineCounts }) {
  const total = counts.hypothesis + counts.early + counts.validating + counts.proven
  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4">
      <div className="text-sm font-medium mb-3">Truth Pipeline</div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-gray-50 p-2">
          <div className="text-[11px] text-gray-500">Hypothesis</div>
          <div className="text-gray-900 font-semibold">{counts.hypothesis}</div>
        </div>
        <div className="rounded-lg bg-blue-50 p-2">
          <div className="text-[11px] text-gray-500">Early Signal</div>
          <div className="text-gray-900 font-semibold">{counts.early}</div>
        </div>
        <div className="rounded-lg bg-yellow-50 p-2">
          <div className="text-[11px] text-gray-500">Validating</div>
          <div className="text-gray-900 font-semibold">{counts.validating}</div>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2">
          <div className="text-[11px] text-gray-500">Proven</div>
          <div className="text-gray-900 font-semibold">{counts.proven}</div>
        </div>
      </div>
      <div className="text-[11px] text-gray-500 mt-2">{total} total</div>
    </div>
  )
}






