'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HEALTH_PRIORITIES } from '@/lib/types';

interface StackAnalysis {
  priorities: string[];
  spending: Array<{
    category: string;
    amount: number;
    percentage: number;
    supplements: string[];
  }>;
  mismatches: Array<{
    type: 'overspending' | 'underspending' | 'missing';
    category: string;
    message: string;
  }>;
  recommendations: string[];
}

export function StackOptimizer() {
  const supabase = createClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<StackAnalysis | null>(null);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSupplements();
    loadSavedPriorities();
  }, []);

  async function loadSupplements() {
    const { data } = await supabase
      .from('user_supplement')
      .select('*, canonical_supplement:canonical_supplement_id(default_goal_tags)')
      .eq('is_active', true);
    
    setSupplements(data || []);
  }

  async function loadSavedPriorities() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('app_user')
      .select('health_priorities')
      .eq('id', user.id)
      .single();

    if ((data as any)?.health_priorities && (data as any).health_priorities.length > 0) {
      setSelectedPriorities((data as any).health_priorities);
      generateAnalysis((data as any).health_priorities);
    }
  }

  function togglePriority(key: string) {
    if (selectedPriorities.includes(key)) {
      setSelectedPriorities(selectedPriorities.filter(p => p !== key));
    } else if (selectedPriorities.length < 3) {
      setSelectedPriorities([...selectedPriorities, key]);
    }
  }

  async function handleAnalyze() {
    if (selectedPriorities.length === 0) return;

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await (supabase
        .from('app_user') as any)
        .update({ health_priorities: selectedPriorities })
        .eq('id', user.id);
    }

    generateAnalysis(selectedPriorities);
    setShowModal(false);
    setLoading(false);
  }

  function generateAnalysis(priorities: string[]) {
    const categoryMap: Record<string, any[]> = {};
    supplements.forEach(supp => {
      const tags = supp.canonical_supplement?.default_goal_tags || [];
      const primaryTag = tags[0] || 'other';
      if (!categoryMap[primaryTag]) categoryMap[primaryTag] = [];
      categoryMap[primaryTag].push(supp);
    });

    const totalSpend = supplements.length * 14; // Placeholder
    const spending = Object.entries(categoryMap).map(([category, supps]) => {
      const amount = supps.length * 14;
      return {
        category,
        amount,
        percentage: totalSpend ? Math.round((amount / totalSpend) * 100) : 0,
        supplements: supps.map(s => s.name)
      };
    }).sort((a, b) => b.amount - a.amount);

    const mismatches: StackAnalysis['mismatches'] = [];
    spending.forEach(cat => {
      if (!priorities.includes(cat.category) && cat.percentage > 30) {
        mismatches.push({
          type: 'overspending',
          category: cat.category,
          message: `You're spending ${cat.percentage}% ($${cat.amount}/mo) on ${formatCategory(cat.category)}, which isn't in your top 3 priorities.`
        });
      }
    });
    priorities.forEach((priority, idx) => {
      const spend = spending.find(s => s.category === priority);
      if (!spend) {
        mismatches.push({
          type: 'missing',
          category: priority,
          message: `${formatCategory(priority)} is your #${idx + 1} priority, but you're not taking any supplements for it.`
        });
      } else if (spend.percentage < 15 && idx === 0) {
        mismatches.push({
          type: 'underspending',
          category: priority,
          message: `${formatCategory(priority)} is your #${idx + 1} priority, but only gets ${spend.percentage}% of your budget.`
        });
      }
    });

    const recommendations: string[] = [];
    if (mismatches.length > 0) {
      recommendations.push('Consider reallocating spending to match your stated priorities.');
      const overspending = mismatches.find(m => m.type === 'overspending');
      const missing = mismatches.find(m => m.type === 'missing');
      if (overspending && missing) {
        recommendations.push(
          `Drop supplements for ${formatCategory(overspending.category)} and invest in ${formatCategory(missing.category)} instead.`
        );
      }
    } else {
      recommendations.push('Your spending aligns well with your priorities.');
    }

    setAnalysis({ priorities, spending, mismatches, recommendations });
  }

  function formatCategory(key: string): string {
    const priority = HEALTH_PRIORITIES.find(p => p.key === key);
    return priority ? priority.label : key;
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Stack Optimizer</h2>
        <p className="text-slate-600 mb-6">Tell us your priorities and we'll analyze if your stack matches your goals.</p>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Set Your Priorities →
        </button>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">What are your top health priorities?</h3>
              <p className="text-slate-600 mb-6">Select up to 3 priorities. We'll analyze how your supplement spending aligns.</p>

              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {HEALTH_PRIORITIES.map(priority => {
                  const selected = selectedPriorities.includes(priority.key);
                  const position = selectedPriorities.indexOf(priority.key);
                  return (
                    <button
                      key={priority.key}
                      onClick={() => togglePriority(priority.key)}
                      disabled={!selected && selectedPriorities.length >= 3}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        selected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                      } ${!selected && selectedPriorities.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{priority.emoji}</span>
                          <span className="font-medium text-slate-900">{priority.label}</span>
                        </div>
                        {selected && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">#{position + 1}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                <button
                  onClick={handleAnalyze}
                  disabled={selectedPriorities.length === 0 || loading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Analyze My Stack'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Stack Analysis</h2>
          <button onClick={() => setShowModal(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Change priorities</button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Your Priorities</h3>
          <ol className="list-decimal list-inside space-y-1">
            {analysis.priorities.map(p => (
              <li key={p} className="text-slate-700">{formatCategory(p)}</li>
            ))}
          </ol>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Your Spending</h3>
          <div className="space-y-3">
            {analysis.spending.map(cat => {
              const isPriority = analysis.priorities.includes(cat.category);
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isPriority ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-900">{formatCategory(cat.category)}</span>
                      <span className="text-sm text-slate-600">${cat.amount}/mo · {cat.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${isPriority ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${cat.percentage}%` }} />
                    </div>
                    {!isPriority && cat.percentage > 20 && (
                      <p className="text-xs text-red-600 mt-1">⚠️ Not in your top 3 priorities</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {analysis.mismatches.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-sm font-semibold text-amber-900 mb-3">⚠️ Mismatches Detected</h3>
            <ul className="space-y-2">
              {analysis.mismatches.map((m, idx) => (
                <li key={idx} className="text-sm text-amber-900">• {m.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Recommendations</h3>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-slate-700">• {rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}




