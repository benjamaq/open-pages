'use client'

export default function UploadInstructions() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
      <div className="text-sm font-semibold text-gray-900">How to export your data</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-md border border-gray-200 p-3">
          <div className="text-sm font-semibold text-gray-900 mb-2">Apple Health</div>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Open the Health app on your iPhone</li>
            <li>Tap your profile picture (top right)</li>
            <li>Tap “Export All Health Data”</li>
            <li>Wait for export to finish (few minutes)</li>
            <li>Save the export.zip file</li>
            <li>Upload the export.zip here</li>
          </ol>
        </div>
        <div className="rounded-md border border-gray-200 p-3">
          <div className="text-sm font-semibold text-gray-900 mb-2">WHOOP</div>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Go to app.whoop.com</li>
            <li>Profile → Settings → Data Export</li>
            <li>Request data export</li>
            <li>Download the CSV when ready</li>
            <li>Upload the CSV here</li>
          </ol>
        </div>
        <div className="rounded-md border border-gray-200 p-3">
          <div className="text-sm font-semibold text-gray-900 mb-2">Fitbit</div>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Go to fitbit.com/settings/data/export</li>
            <li>Request your data archive</li>
            <li>Download when ready</li>
            <li>Upload the ZIP or CSV here</li>
          </ol>
        </div>
      </div>
      <div className="text-xs text-gray-600">
        Tip: You can also upload a simple CSV with columns like <span className="font-mono">date,sleep_quality,hrv,resting_hr</span>.
      </div>
    </div>
  )
}


