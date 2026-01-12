'use client'

export default function UploadInstructions() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
      <div className="text-sm font-semibold text-gray-900">How to export your data</div>
      <div className="space-y-2">
        <details className="rounded-md border border-gray-200 p-3" open>
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Apple Health (recommended)</summary>
          <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Open the Health app on your iPhone</li>
            <li>Tap your profile picture (top right)</li>
            <li>Tap “Export All Health Data”</li>
            <li>Wait for export to finish (few minutes)</li>
            <li>Save the export.zip file</li>
            <li>Upload the export.zip here</li>
          </ol>
        </details>
        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">WHOOP</summary>
          <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Go to app.whoop.com</li>
            <li>Profile → Settings → Data Export</li>
            <li>Request data export</li>
            <li>Download the CSV when ready</li>
            <li>Upload the CSV here</li>
          </ol>
        </details>
        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Oura</summary>
          <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Open Oura (app or web)</li>
            <li>Settings → Export Data</li>
            <li>Download the file</li>
            <li>Upload it here</li>
          </ol>
        </details>
        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Garmin</summary>
          <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Open Garmin Connect (web is easiest)</li>
            <li>Export your health metrics</li>
            <li>Download the file</li>
            <li>Upload it here</li>
          </ol>
        </details>
        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Fitbit</summary>
          <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Go to fitbit.com/settings/data/export</li>
            <li>Request your data archive</li>
            <li>Download when ready</li>
            <li>Upload the ZIP or CSV here</li>
          </ol>
        </details>
        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Athlytic</summary>
          <div className="mt-2 text-sm text-gray-700">
            Athlytic data is included via Apple Health. Export from Apple Health and upload the ZIP here.
          </div>
        </details>
        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Livity</summary>
          <div className="mt-2 text-sm text-gray-700">
            Livity data is included via Apple Health. Export from Apple Health and upload the ZIP here.
          </div>
        </details>
        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Bevel</summary>
          <div className="mt-2 text-sm text-gray-700">
            Bevel data is included via Apple Health. Export from Apple Health and upload the ZIP here.
          </div>
        </details>
        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Generic CSV</summary>
          <div className="mt-2 text-sm text-gray-700">
            Use columns like <span className="font-mono">date,sleep_quality,energy,hrv,resting_hr</span>. We auto-detect source if possible.
          </div>
        </details>
      </div>
    </div>
  )
}


