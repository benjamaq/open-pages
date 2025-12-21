type Props = {
  stats: {
    sleepHours: number;
    hrvMs: number;
    energyScore: number;
  } | null;
};

export default function QuickStatsBar({ stats }: Props) {
  if (!stats) return null;
  
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-xs text-gray-500 font-medium">Last 7 days</span>
          
          <div className="flex items-center gap-2">
            <span>💤</span>
            <span className="text-sm font-medium text-gray-900">
              {stats.sleepHours}h
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span>❤️</span>
            <span className="text-sm font-medium text-gray-900">
              HRV {stats.hrvMs}ms
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span className="text-sm font-medium text-gray-900">
              Energy {stats.energyScore}
            </span>
          </div>
          
          <span className="text-xs text-gray-400 ml-auto">
            Context only (watch-derived). Truth comes from your experiments.
          </span>
        </div>
      </div>
    </div>
  );
}


