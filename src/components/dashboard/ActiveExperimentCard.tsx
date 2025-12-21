type Props = {
  experiment: {
    name: string;
    day: number;
    totalDays: number;
    keyMetric: { label: string; delta: string; isProvisional: boolean };
  } | null;
  onStartExperiment: () => void;
  onPause: () => void;
  onViewProtocol: () => void;
};

export default function ActiveExperimentCard({
  experiment,
  onStartExperiment,
  onPause,
  onViewProtocol
}: Props) {
  if (!experiment) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🧪</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No active test</h3>
          <p className="text-sm text-gray-600 mb-4">Run a 7-day protocol to see real effects</p>
          <button onClick={onStartExperiment} className="px-6 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
            Start a 7-day test
          </button>
        </div>
      </div>
    );
  }
  const progressPercent = Math.min(100, (experiment.day / experiment.totalDays) * 100);
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧪</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{experiment.name}</h3>
            <p className="text-sm text-gray-600">Day {experiment.day}/{experiment.totalDays}</p>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{experiment.keyMetric.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-600">{experiment.keyMetric.delta}</span>
            {experiment.keyMetric.isProvisional && <span className="text-xs text-gray-500">(provisional)</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onPause} className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          Pause
        </button>
        <button onClick={onViewProtocol} className="flex-1 px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors">
          View Protocol
        </button>
      </div>
    </div>
  );
}


