'use client'
import { WearableDevice } from '@/types/WearableDevice'

const MAP: Record<WearableDevice, { title: string; steps: string[]; note?: string }> = {
  [WearableDevice.WHOOP]: {
    title: 'How to get your data (WHOOP — separate export)',
    steps: [
      'Open the WHOOP app',
      'Go to Settings → Data Export',
      'Request export (may say up to 24h — often faster)',
      'Download and upload the file here'
    ],
    note: 'WHOOP uses its own export. It does not flow through Apple Health.'
  },
  [WearableDevice.OURA]: {
    title: 'How to get your data (Oura)',
    steps: [
      'Open Oura (app or web)',
      'Go to Settings → Export Data',
      'Download your file',
      'Upload it here'
    ]
  },
  [WearableDevice.APPLE_HEALTH]: {
    title: 'How to get your data (Apple Health — aggregator)',
    steps: [
      'Open Apple Health',
      'Tap your Profile',
      'Select Export Health Data',
      'Upload the export here (ZIP file)'
    ],
    note: 'Apple Health acts as an aggregator. The ZIP includes connected app data.'
  },
  [WearableDevice.BEVEL]: {
    title: 'Bevel data is included via Apple Health',
    steps: [
      'Open Apple Health on your iPhone',
      'Tap your Profile → Export All Health Data',
      'Wait for the export to finish',
      'Upload the ZIP here — it includes Bevel data automatically'
    ],
    note: 'Choosing Apple Health covers Bevel — no extra steps in Bevel needed.'
  },
  [WearableDevice.ATHLYTIC]: {
    title: 'Athlytic data is included via Apple Health',
    steps: [
      'Open Apple Health on your iPhone',
      'Tap your Profile → Export All Health Data',
      'Wait for the export to finish',
      'Upload the ZIP here — it includes Athlytic data automatically'
    ],
    note: 'Apple Health acts as the aggregator — Athlytic data comes along.'
  },
  [WearableDevice.LIVITY]: {
    title: 'Livity data is included via Apple Health',
    steps: [
      'Open Apple Health on your iPhone',
      'Tap your Profile → Export All Health Data',
      'Wait for the export to finish',
      'Upload the ZIP here — it includes Livity data automatically'
    ],
    note: 'Apple Health export includes Livity’s data; no Livity export needed.'
  },
  [WearableDevice.GARMIN]: {
    title: 'How to get your data (Garmin)',
    steps: [
      'Open Garmin Connect (web is easiest)',
      'Export your health metrics',
      'Download the file',
      'Upload it here'
    ]
  },
  [WearableDevice.FITBIT]: {
    title: 'How to get your data (Fitbit)',
    steps: [
      'Open Fitbit (app or web)',
      'Export your health metrics',
      'Download the file',
      'Upload it here'
    ]
  },
  [WearableDevice.OTHER]: {
    title: 'Using another app',
    steps: [
      'Export your health data (CSV or ZIP)',
      'Download the file',
      'Upload it here',
      'If unsure, use the CSV option below'
    ]
  },
  [WearableDevice.NOT_SURE]: {
    title: "Not sure where your data lives?",
    steps: [
      'If your data lives in Apple Health, export from Apple Health',
      'Otherwise, export a CSV from your app',
      'Then upload it here'
    ]
  }
}

export default function DeviceInstructions({ device }: { device: WearableDevice }) {
  const cfg = MAP[device]
  if (!cfg) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-900 mb-2">{cfg.title}</div>
      <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
        {cfg.steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
      {device === WearableDevice.WHOOP && (
        <p className="text-xs text-slate-500 mt-2">WHOOP may say it can take up to 24 hours — it’s often faster.</p>
      )}
      {cfg.note && (
        <p className="text-xs text-slate-500 mt-2">{cfg.note}</p>
      )}
    </div>
  )
}


