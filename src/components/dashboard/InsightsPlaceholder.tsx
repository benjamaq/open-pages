type Props = {
  hasUploadedData: boolean;
  completedCheckins: number;
  targetCheckins: number;
};

export default function InsightsPlaceholder({
  hasUploadedData,
  completedCheckins,
  targetCheckins
}: Props) {
  const needsData = !hasUploadedData && completedCheckins < targetCheckins;
  
  return (
    <div data-testid="insights-panel" className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">INSIGHTS</h3>
      {needsData ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🔬</div>
          <p className="text-sm text-gray-600 mb-4">Analysis in progress...</p>
          <p className="text-sm text-gray-500">
            Upload 30+ days of data <strong>OR</strong><br />
            Complete {Math.max(0, targetCheckins - completedCheckins)} more daily checks to unlock
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Your patterns are coming together. Analysis ready soon.
          </p>
        </div>
      )}
    </div>
  );
}


