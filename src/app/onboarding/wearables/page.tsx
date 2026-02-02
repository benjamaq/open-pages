'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingBackground from '@/components/onboarding/OnboardingBackground'
import OnboardingCard from '@/components/onboarding/OnboardingCard'
import { WearableQuestion } from '@/components/onboarding/WearableQuestion'
import { NoWearablePath } from '@/components/onboarding/NoWearablePath'
import UploadClarification from '@/components/onboarding/UploadClarification'
import { DeviceSelector } from '@/components/onboarding/DeviceSelector'
import DeviceInstructions from '@/components/onboarding/DeviceInstructions'
import HealthDataUploader from '@/components/upload/HealthDataUploader'
import UploadSuccess from '@/components/upload/UploadSuccess'
import AppleHealthUploader from '@/components/upload/AppleHealthUploader'
import SupplementHistorySection from '@/components/onboarding/SupplementHistorySection'
import AdvancedCsvAccordion from '@/components/upload/AdvancedCsvAccordion'
import ContinueWithoutUpload from '@/components/onboarding/ContinueWithoutUpload'
import { WearableDevice } from '@/types/WearableDevice'
import type { UploadResult } from '@/types/UploadResult'

export default function WearablesStep() {
  const router = useRouter()
  const [hasWearable, setHasWearable] = useState<boolean | null>(null)
  const [device, setDevice] = useState<WearableDevice | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [showMobileWarn, setShowMobileWarn] = useState<boolean>(false)

  function goNext() {
    router.push('/onboarding/report-ready')
  }
  function goDashboardAfterUpload() {
    // Route to dashboard with baseline-success flag so we show the Baseline enhanced popup
    router.push('/dashboard?upload=success&source=Apple%20Health')
  }

  return (
    <main className="min-h-screen relative">
      <OnboardingBackground />
      <OnboardingCard>
        {/* Entry question */}
        {hasWearable === null && (
          <WearableQuestion onYes={() => setHasWearable(true)} onNo={() => setHasWearable(false)} />
        )}

        {/* No-wearable path */}
        {hasWearable === false && (
          <NoWearablePath onContinue={() => router.push('/dashboard')} />
        )}

        {/* Yes-wearable path */}
        {hasWearable === true && (
          <div className="space-y-6">
            {/* Mobile warning modal (shown once per device if on mobile) */}
            {(() => {
              const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)
              const shouldShow = isMobile && showMobileWarn
              if (!shouldShow) return null
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileWarn(false)} />
                  <div className="relative z-10 w-full max-w-[440px] rounded-xl bg-white p-6 shadow-lg border border-gray-200">
                    <div className="text-base font-semibold text-gray-900">Better on desktop</div>
                    <div className="mt-2 text-sm text-gray-700">
                      Uploading health data works best on desktop. Would you like to continue on mobile or switch to desktop?
                    </div>
                    <div className="mt-4 flex gap-2 justify-end">
                      <button
                        className="px-3 h-9 rounded border border-gray-300 text-sm text-gray-800 hover:bg-gray-50"
                        onClick={() => {
                          try { localStorage.setItem('wearablesMobileWarnDismissed', '1') } catch {}
                          setShowMobileWarn(false)
                        }}
                      >
                        Continue on mobile
                      </button>
                      <a
                        className="px-3 h-9 rounded bg-[#111111] text-white text-sm hover:opacity-90 flex items-center"
                        href="/onboarding/wearables"
                        onClick={() => {
                          try { localStorage.removeItem('wearablesMobileWarnDismissed') } catch {}
                        }}
                      >
                        I’ll use desktop
                      </a>
                    </div>
                  </div>
                </div>
              )
            })()}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Great — you can use that here.</h1>
              <p className="text-slate-700 mt-2">
                Wearables and health apps store useful history. Uploading that data gives BioStackr more signal to work with from the start,
                which can surface patterns sooner. Sooner ≠ required.
              </p>
            </div>

            <UploadClarification />

            <DeviceSelector selected={device} onSelect={(d) => setDevice(d)} />
            {(() => {
              // When a device is selected on mobile, show the warning once
              const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)
              const dismissed = typeof window !== 'undefined' && localStorage.getItem('wearablesMobileWarnDismissed') === '1'
              if (device && isMobile && !dismissed && !showMobileWarn) {
                setShowMobileWarn(true)
              }
              return null
            })()}
            {device && <DeviceInstructions device={device} />}

            {/* Only show upload after device chosen */}
            {device && (
              <div className="space-y-4">
                {(device === WearableDevice.APPLE_HEALTH || device === WearableDevice.BEVEL || device === WearableDevice.ATHLYTIC || device === WearableDevice.LIVITY) && (
                  <AppleHealthUploader
                    onSuccess={goDashboardAfterUpload}
                    onSkip={goNext}
                  />
                )}
                {device === WearableDevice.WHOOP && (
                  <HealthDataUploader
                    endpoint="/api/upload/whoop"
                    accept=".zip,.csv"
                    title="Upload WHOOP export"
                    helper="ZIP or CSV files supported (physiological_cycles.csv, sleeps.csv, etc.)."
                    onUploadComplete={(r) => setResult(r)}
                  />
                )}
                {(device === WearableDevice.OURA || device === WearableDevice.GARMIN || device === WearableDevice.FITBIT || device === WearableDevice.OTHER || device === WearableDevice.NOT_SURE) && (
                  <HealthDataUploader
                    endpoint="/api/import/health-data"
                    accept=".zip,.xml,.csv,.json"
                    title="Upload your export file"
                    helper="ZIP (Apple Health), XML, CSV, or JSON supported."
                    onUploadComplete={(r) => setResult(r)}
                  />
                )}
                {result && <UploadSuccess summary={result} />}
              </div>
            )}

            {/* Supplement logs (optional) */}
            <SupplementHistorySection />

            {/* Advanced CSV (power users) */}
            <AdvancedCsvAccordion />

            {/* Exit path */}
            <ContinueWithoutUpload onContinue={goNext} />
          </div>
        )}
      </OnboardingCard>
    </main>
  )
}


