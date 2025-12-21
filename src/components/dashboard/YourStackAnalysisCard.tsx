'use client';

import { Progress } from "@/components/ui/progress";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Flame, CheckCircle2, BarChart3, ArrowRight } from "lucide-react";

export function YourStackAnalysisCard({
  analyzedCount = 5,
  totalSupps = 40,
  streakDays = 0,
  readyCount = 5,
  buildingCount = 35,
  needsDataCount = 0,
  progressPercent = 13,
  nextResultName = "Creatine",
  nextResultETA = "~3 more clean nights of check-ins",
  nextResultDetails,
  nextResultId,
  motivation,
  disruptions,
  onCheckIn,
  ownerName,
}: {
  analyzedCount?: number;
  totalSupps?: number;
  streakDays?: number;
  readyCount?: number;
  buildingCount?: number;
  needsDataCount?: number;
  progressPercent?: number;
  nextResultName?: string | null;
  nextResultETA?: string | null;
  nextResultDetails?: { cleanDays: number; requiredDays: number; remainingDays: number } | undefined;
  nextResultId?: string;
  motivation?: string[] | undefined;
  disruptions?: Array<{ label: string; count: number }>;
  onCheckIn?: () => void;
  ownerName?: string;
}) {
  return (
    <div className="w-full rounded-xl border bg-white p-6 shadow-sm">
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {ownerName ? `${ownerName}'s stack analysis` : 'Your stack analysis'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {analyzedCount} of {totalSupps} analyzed • Most need 2–4 weeks of consistent check-ins.
        </p>
      </div>
      <div className="mt-4" />

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* LEFT COLUMN — spans 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* PROGRESS BLOCK */}
          <div className="pt-4 pb-4 border-t">
            <div className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>Stack progress</span>
              <span>{progressPercent}% complete</span>
            </div>
            <div className="mt-2">
              <Progress value={progressPercent} className="h-3 w-full" />
            </div>
          </div>

          {/* STATUS PILLS */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-medium text-gray-800">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>Days tracked: {streakDays}</span>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-gray-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Ready: {readyCount}</span>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-1.5 text-sm font-medium text-gray-800">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <span>Building: {buildingCount}</span>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-gray-800">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              <span>Needs data: {needsDataCount}</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onCheckIn}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Complete today’s check-in
            <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>

        {/* RIGHT COLUMN — NEXT RESULT */}
        <div
          className="rounded-xl p-6 shadow-md self-start cursor-pointer"
          style={{ backgroundColor: '#F6F5F3', border: '1px solid #E4E1DC' }}
          onClick={() => {
            if (nextResultId) {
              try { window.location.hash = `supp-${nextResultId}` } catch {}
            }
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (nextResultId) {
                try { window.location.hash = `supp-${nextResultId}` } catch {}
              }
            }
          }}
        >
          <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#55514A' }}>Next result likely</p>
          <p className="mt-3 text-lg font-bold text-gray-900">{nextResultName ?? '—'}</p>
          {nextResultDetails && nextResultDetails.remainingDays > 0 ? (
            <div className="mt-1">
              <div className="text-3xl font-extrabold text-gray-900">{`~${nextResultDetails.remainingDays}`}</div>
              <div className="text-sm text-gray-700">clean days remaining</div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">{nextResultETA ?? ''}</p>
          )}
          {nextResultDetails && (
            <div className="mt-2 text-xs text-gray-700">
              <div>Clean days: <span className="font-medium">{nextResultDetails.cleanDays}</span></div>
              <div>Required: <span className="font-medium">{nextResultDetails.requiredDays}</span></div>
            </div>
          )}
          {Array.isArray(motivation) && motivation.length > 0 && (
            <ul className="mt-2 text-xs text-gray-700 list-disc pl-4 space-y-0.5">
              {motivation.slice(0, 3).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
          {Array.isArray(disruptions) && disruptions.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                  Some disruptions this week
                  <InfoTooltip text={"Disruptions like alcohol, travel, or stress temporarily affect your scores, which makes it harder to detect supplement effects. We adjust your timeline to keep results accurate."} />
                </p>
              </div>
              <ul className="mt-2 text-xs text-amber-900 space-y-1">
                {disruptions.map((d, i) => (
                  <li key={i}>• {d.count} × {d.label}</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-amber-800">This can delay results. A few clean days will speed things up.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


