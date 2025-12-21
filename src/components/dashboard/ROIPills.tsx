type Props = {
  monthlySavings: number;
  truthProgress: { checks: number; target: number };
};

export default function ROIPills({ monthlySavings, truthProgress }: Props) {
  const progressPercent = Math.min(100, (truthProgress.checks / truthProgress.target) * 100);
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Savings Pill */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
            <span className="text-lg">💰</span>
            <span className="text-sm font-semibold text-gray-900">
              Saving €{Math.max(0, Math.round(monthlySavings))}/mo
            </span>
          </div>
          
          {/* Truth Report Unlock */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
            <span className="text-lg">🔓</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Truth Report
              </span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-blue-600">
                  {truthProgress.checks}/{truthProgress.target}
                </span>
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


