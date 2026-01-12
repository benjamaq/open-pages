'use client'

export default function UploadInstructions() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
      <div className="text-sm font-semibold text-gray-900">How to export your data</div>
      <div className="space-y-2">
        <details className="rounded-md border border-gray-200 p-3" open>
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Apple Health (recommended for iPhone)</summary>
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
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Google Fit / Health Connect (recommended for Android)</summary>
          <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Open Google Fit or Health Connect on your Android</li>
            <li>Go to Settings → Data &amp; privacy</li>
            <li>Export or Download your data (CSV/ZIP)</li>
            <li>Transfer the file to your computer/phone</li>
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
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Samsung Health</summary>
          <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Open Samsung Health</li>
            <li>Menu → Settings → Download personal data</li>
            <li>Export your data (ZIP/CSV)</li>
            <li>Upload the exported file here</li>
          </ol>
        </details>
        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Withings</summary>
          <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Log in to withings.com (Health Mate)</li>
            <li>Account → Data → Export</li>
            <li>Download your data (CSV)</li>
            <li>Upload the file here</li>
          </ol>
        </details>
        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Other (CSV, JSON, XML)</summary>
          <div className="mt-2 text-sm text-gray-700">
            Don’t see your device? Most health apps can export CSV or JSON. Upload any file with columns like{' '}
            <span className="font-mono">date, sleep_quality, hrv, resting_hr</span>. We’ll auto-detect and import what we can.
          </div>
        </details>
      </div>
    </div>
  )
}


