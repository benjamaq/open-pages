'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface Supplement {
  id: string;
  name: string;
  brand_name?: string;
  monthly_cost_usd: number;
  primary_goal_tags: string[];
  frequency_label?: string;
  days_per_week?: number;
  time_of_day?: string[];
  daily_dose_amount?: number;
  daily_dose_unit?: string;
  created_at: string;
  start_date?: string | null;
  stage?: string;
}

interface CheckIn {
  id: string;
  date: string;
  energy_level: number;
  sleep_quality: number;
  mood: number;
  stress_level: number;
  mental_clarity: number;
}

interface Analysis {
  id: string;
  name: string;
  monthly_cost: number | null;
  start_date: string | null;
  effect_size: number; // 0..1
  confidence_score: number; // 0..1
  status: string;
  sample_size: number;
  pre_mean: number | null;
  post_mean: number | null;
}

export default function SupplementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [supplement, setSupplement] = useState<Supplement | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCostModal, setShowCostModal] = useState(false);
  const [costInput, setCostInput] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch supplement
        const suppRes = await fetch(`/api/supplements/${(params as any).id}`);
        if (!suppRes.ok) throw new Error('Failed to fetch supplement');
        const suppData = await suppRes.json();
        setSupplement(suppData);

        // Fetch analysis for this intervention/supplement id
        const patRes = await fetch(`/api/insights/patterns/${(params as any).id}`, { cache: 'no-store' });
        if (patRes.ok) {
          const patData = await patRes.json();
          setAnalysis(patData);
        } else {
          setAnalysis(null);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    if ((params as any).id) {
      fetchData();
    }
  }, [params]);

  async function refreshData() {
    try {
      const suppRes = await fetch(`/api/supplements/${(params as any).id}`, { cache: 'no-store' });
      if (suppRes.ok) setSupplement(await suppRes.json());
      const patRes = await fetch(`/api/insights/patterns/${(params as any).id}`, { cache: 'no-store' });
      if (patRes.ok) setAnalysis(await patRes.json());
    } catch {}
  }

  async function saveCost() {
    const value = parseFloat(costInput);
    if (isNaN(value)) {
      setShowCostModal(false);
      return;
    }
    const body = { monthly_cost: Math.max(0, Math.min(80, value)) };
    const res = await fetch(`/api/supplements/${(params as any).id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    setShowCostModal(false);
    if (res.ok) {
      await refreshData();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!supplement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Supplement not found</p>
      </div>
    );
  }

  // Format purposes for display
  const purposes = supplement.primary_goal_tags || [];
  
  // Calculate annual cost
  const monthlyCost = (analysis?.monthly_cost ?? supplement.monthly_cost_usd) || 0;
  const annualCost = monthlyCost * 12;

  // Get frequency display
  const getFrequencyDisplay = () => {
    if (supplement.frequency_label) return supplement.frequency_label;
    if (supplement.days_per_week === 7) return "Daily";
    if (supplement.days_per_week) return `${supplement.days_per_week} days/week`;
    return "Daily";
  };

  // Get dose display
  const getDoseDisplay = () => {
    if (supplement.daily_dose_amount && supplement.daily_dose_unit) {
      return `${supplement.daily_dose_amount} ${supplement.daily_dose_unit}`;
    }
    return null;
  };

  // Get time of day display
  const getTimeDisplay = () => {
    if (supplement.time_of_day && supplement.time_of_day.length > 0) {
      return supplement.time_of_day.map(t => 
        t.charAt(0).toUpperCase() + t.slice(1)
      ).join(', ');
    }
    return null;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const pct = (v?: number | null) => `${Math.round(((v ?? 0) * 100))}%`;
  const startDate = (supplement.start_date || supplement.created_at);
  const displayStatus = (s: string | undefined) => {
    const key = String(s || '').toLowerCase();
    if (key === 'significant') return 'Significant positive effect';
    if (key === 'negative') return 'Significant negative effect';
    if (key === 'inconclusive') return 'No clear effect detected';
    return 'Signal status';
  };
  const cv = (supplement as any)?.caveats || null;

  // Purpose label formatting
  const formatPurpose = (purpose: string) => {
    const labels: Record<string, string> = {
      'sleep_quality': '🛏️ Sleep',
      'sleep': '🛏️ Sleep',
      'energy': '⚡ Energy',
      'energy_stamina': '⚡ Energy',
      'cognitive': '🧠 Focus',
      'cognitive_performance': '🧠 Focus',
      'stress_mood': '😌 Stress',
      'stress': '😌 Stress',
      'mood': '😌 Mood',
      'gut_health': '🌿 Gut Health',
      'longevity': '🧬 Longevity',
      'immunity': '🛡️ Immunity',
      'athletic_performance': '🏃 Athletic',
      'joint_bone_health': '🦴 Joints',
      'skin_hair_nails': '✨ Skin/Hair',
      'inflammation': '🔥 Inflammation',
    };
    return labels[purpose.toLowerCase()] || purpose;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
              ← Back to Dashboard
            </Link>
            <div className="flex gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/insights" className="text-gray-600 hover:text-gray-900">Insights</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{supplement.name}</h1>
          {supplement.brand_name && (
            <p className="text-gray-500">{supplement.brand_name}</p>
          )}
          {getDoseDisplay() && (
            <p className="text-gray-600 mt-1">{getDoseDisplay()} • {getFrequencyDisplay()}</p>
          )}
        </div>

        {/* Purpose Chips */}
        {purposes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {purposes.map((purpose, index) => (
              <span 
                key={index}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700"
              >
                {formatPurpose(purpose)}
              </span>
            ))}
          </div>
        )}

        {/* Protocol Card */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Protocol</h2>
          
          <div className="space-y-3">
            {getTimeDisplay() && (
              <div className="flex justify-between">
                <span className="text-gray-600">Time of Day</span>
                <span className="font-medium text-gray-900">{getTimeDisplay()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Frequency</span>
              <span className="font-medium text-gray-900">{getFrequencyDisplay()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Started</span>
              <span className="font-medium text-gray-900">{formatDate(startDate)}</span>
            </div>
          </div>
        </section>

        {/* Noise caveats */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-amber-700">⚠️ Noise detected during test</summary>
            <div className="mt-3 text-sm text-slate-700 space-y-1">
              {cv?.illnessDays && cv.illnessDays > 0 && (
                <p>🤒 {cv.illnessDays} illness days (adds noise)</p>
              )}
              {cv?.alcoholDays && cv.alcoholDays > 2 && (
                <p>🍷 {cv.alcoholDays} alcohol days (adds noise)</p>
              )}
              {cv?.travelDays && cv.travelDays > 0 && (
                <p>✈️ {cv.travelDays} travel days (adds noise)</p>
              )}
              {cv?.sleepVarianceMinutes && cv.sleepVarianceMinutes > 60 && (
                <p>😴 Inconsistent sleep schedule (±{cv.sleepVarianceMinutes} min) — adds noise</p>
              )}
              {typeof cv?.dataCompleteness === 'number' && cv.dataCompleteness < 80 && (
                <p>📉 Only {cv.dataCompleteness}% of days had complete data — need more signal</p>
              )}
              {!cv && <p className="text-slate-500">No data quality caveats detected.</p>}
              <p className="mt-2 text-slate-600">More noise = harder to find signal. Try testing during a clean 2-week period for clearer results.</p>
            </div>
          </details>
        </section>

        {/* Signal Analysis */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Signal Analysis</h2>
          {analysis ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Days of signal <InfoTooltip text={'Total days used to assess the signal. More clean days → clearer results.'} /></span>
                <span className="font-medium text-gray-900">{analysis.sample_size} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Baseline average</span>
                <span className="font-medium text-gray-900">{analysis.pre_mean != null ? analysis.pre_mean.toFixed(2) : 'Not available'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">With supplement</span>
                <span className="font-medium text-gray-900">{analysis.post_mean != null ? analysis.post_mean.toFixed(2) : 'Not available'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Signal</span>
                <span className="font-medium text-gray-900">+{pct(analysis.effect_size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Signal strength <InfoTooltip text={'How confident we are in this result. Above 70% is good. Below 50% means we need more clean data.'} /></span>
                <span className="font-medium text-gray-900">{pct(analysis.confidence_score)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium text-gray-900">
                  {(() => {
                    const s = String(analysis.status || '').toLowerCase()
                    if (s === 'significant' && (analysis.effect_size || 0) > 0) return 'Strong signal — working'
                    if (s === 'significant' && (analysis.effect_size || 0) < 0) return 'Strong negative signal'
                    if (s === 'inconclusive') return 'Need more signal'
                    if (s === 'confounded') return 'Too much noise'
                    return displayStatus(analysis.status)
                  })()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No analysis available yet.</p>
          )}
        </section>

        {/* Cost Card */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Your Spend</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Cost</span>
              <span className="font-medium text-gray-900 flex items-center gap-2">
                ${monthlyCost.toFixed(2)}
                <button
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Edit monthly cost"
                  onClick={() => {
                    setCostInput(String(Math.round(monthlyCost)));
                    setShowCostModal(true);
                  }}
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l9.06-9.06.92.92L5.92 20.08zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                  </svg>
                </button>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Annual Cost</span>
              <span className="font-medium text-gray-900">${annualCost.toFixed(2)}</span>
            </div>
          </div>
          
          <p className="text-gray-500 text-sm mt-4">
            BioStackr shows where your spend creates real value — and where it doesn't.
          </p>
        </section>

        {/* What we measure footer */}
        <section className="bg-blue-50 rounded-xl border border-blue-200 p-6 mt-6">
          <div className="text-sm text-blue-900">
            <p><strong>We analyze:</strong> Sleep quality, HRV, recovery score</p>
            <p className="mt-1"><strong>We cannot measure:</strong> Cognitive performance, mood, blood biomarkers, long-term effects</p>
          </div>
        </section>

        {showCostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowCostModal(false)} />
            <div className="relative z-10 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
              <div className="mb-3">
                <div className="text-sm text-slate-500">Set monthly cost</div>
                <div className="text-base font-semibold text-slate-900 truncate">{supplement.name}</div>
              </div>
              <div className="mb-4">
                <label className="block text-xs text-slate-600 mb-1">Monthly cost (USD)</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">$</span>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    step="1"
                    value={costInput}
                    onChange={(e) => setCostInput(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="e.g. 25"
                  />
                </div>
                <div className="mt-1 text-[11px] text-slate-500">Clamped between $0–$80</div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowCostModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
                  onClick={saveCost}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Link 
            href="/dashboard"
            className="flex-1 text-center py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
          >
            Back to Dashboard
          </Link>
        </div>

      </main>
    </div>
  );
}

