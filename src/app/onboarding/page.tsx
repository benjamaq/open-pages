'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SupplementDetailsModal, type ProductLike, type SupplementDetails } from './SupplementDetailsModal';
import { abbreviateSupplementName } from '@/lib/utils/abbreviate';
import { toast } from 'sonner';

interface Product {
  id: string;
  productName: string;
  brandName: string;
  canonicalSupplementId: string;
  pricePerContainerDefault: number;
  servingsPerContainerDefault: number;
  dosePerServingAmountDefault: number;
  dosePerServingUnitDefault: string;
}

interface SelectedSupplement extends SupplementDetails {}

export default function OnboardingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [supplements, setSupplements] = useState<SelectedSupplement[]>([]);
  const [pendingProduct, setPendingProduct] = useState<ProductLike | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [showWearableInfo, setShowWearableInfo] = useState(false)
  const [savingWearableFlag, setSavingWearableFlag] = useState(false)
  const mySuppsRef = useRef<HTMLDivElement | null>(null)
  const searchResultsRef = useRef<HTMLDivElement | null>(null)

  // Open full details modal with a minimal product stub (for manual/quick add)
  function openManualAdd(name?: string) {
    const stub: ProductLike = {
      id: crypto.randomUUID(),
      productName: name ?? '',
      brandName: '',
      canonicalSupplementId: '',
      pricePerContainerDefault: 0,
      servingsPerContainerDefault: 0,
      // @ts-ignore – keep compatibility with ProductLike shape
      dosePerServingAmountDefault: 1,
      // @ts-ignore
      dosePerServingUnitDefault: ''
    }
    setPendingProduct(stub)
  }

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Use new iHerb-backed search API
        const res = await fetch(`/api/supplements/search?q=${encodeURIComponent(searchQuery)}`, { cache: 'no-store' });
        const data = await res.json();
        const rows = Array.isArray(data?.results) ? data.results : [];
        // Map to Product shape for downstream modal
        const mapped: Product[] = rows.map((row: any) => {
          const servingsPerContainer = Number(row.servings_per_container ?? 0) || 0;
          const pricePerServing = Number(row.price_per_serving ?? 0) || 0;
          const pricePerContainer = servingsPerContainer > 0 ? pricePerServing * servingsPerContainer : 0;
          return {
            id: String(row.id),
            productName: String(row.title ?? ''),
            brandName: String(row.brand ?? ''),
            canonicalSupplementId: String(row.id),
            pricePerContainerDefault: pricePerContainer,
            servingsPerContainerDefault: servingsPerContainer,
            dosePerServingAmountDefault: 1,
            dosePerServingUnitDefault: 'capsules'
          };
        });
        setSearchResults(mapped);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch user first name for welcome block
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/me', { cache: 'no-store' })
        if (!mounted) return
        if (r.ok) {
          const j = await r.json()
          setFirstName((j?.firstName && String(j.firstName)) || null)
        }
      } catch {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  // Wearable info modal (one-time) — show immediately on onboarding.
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/settings', { cache: 'no-store', credentials: 'include' })
        const j = await r.json().catch(() => ({}))
        if (!mounted) return
        const dismissed = Boolean((j as any)?.wearable_info_dismissed)
        if (!dismissed) setShowWearableInfo(true)
      } catch {
        // fail open: don't block onboarding
      }
    })()
    return () => { mounted = false }
  }, [])

  function addSupplement(product: Product) {
    const isDuplicate = supplements.some((s) => {
      const sameCanonical = s.canonicalSupplementId && String(s.canonicalSupplementId) === String(product.canonicalSupplementId);
      const sameNameBrand =
        String((s.name || '')).trim().toLowerCase() === String((product.productName || '')).trim().toLowerCase() &&
        String((s.brandName || '')).trim().toLowerCase() === String((product.brandName || '')).trim().toLowerCase();
      return Boolean(sameCanonical || sameNameBrand);
    });
    if (isDuplicate) {
      try {
        toast.info('Already added', { description: `${product.brandName} ${product.productName}` });
      } catch {}
      return;
    }
    setPendingProduct(product);
  }

  function removeSupplement(index: number) {
    setSupplements(supplements.filter((_, i) => i !== index));
  }

  async function handleSave(details: SupplementDetails) {
    // Debug logs requested
    // eslint-disable-next-line no-console
    console.log('=== MODAL SAVED DETAILS ===', details)
    const wasEmptyBefore = editIndex == null && supplements.length === 0
    if (editIndex != null) {
      const next = [...supplements];
      next[editIndex] = details;
      setSupplements(next);
      setEditIndex(null);
    } else {
      // Prevent adding duplicates when saving new item
      const isDuplicate = supplements.some((s) => {
        const sameCanonical = s.canonicalSupplementId && details.canonicalSupplementId && String(s.canonicalSupplementId) === String(details.canonicalSupplementId);
        const sameNameBrand =
          String((s.name || '')).trim().toLowerCase() === String((details.name || '')).trim().toLowerCase() &&
          String((s.brandName || '')).trim().toLowerCase() === String((details.brandName || '')).trim().toLowerCase();
        return Boolean(sameCanonical || sameNameBrand);
      });
      if (isDuplicate) {
        try {
          toast.info('Already added', { description: `${details.brandName} ${details.name}` });
        } catch {}
        setPendingProduct(null);
        setSearchQuery('');
        setSearchResults([]);
        return;
      }
      setSupplements([...supplements, details]);
      try {
        toast.success('Added', { description: `${details.brandName ? details.brandName + ' ' : ''}${details.name}`.trim() })
      } catch {}
      // Persist to backend so dashboard sees it immediately
      try {
        // Build dose/timing strings for persistence into user_supplement + stack_items (My Stack display)
        const unitRaw = String((details as any)?.doseUnit || '').trim()
        const unitNorm = (() => {
          const lc = unitRaw.toLowerCase()
          if (!lc) return ''
          if (lc === 'capsule' || lc === 'capsules') return 'caps'
          if (lc === 'iu') return 'IU'
          return lc
        })()
        const doseText = `${Number((details as any)?.dailyDose || 0) || ''}${unitNorm ? (unitNorm === 'IU' ? ' IU' : ` ${unitNorm}`) : ''}`.trim()
        const timingLabel = (() => {
          const t = Array.isArray((details as any)?.timeOfDay) ? (details as any).timeOfDay : []
          if (!t || t.length === 0) return ''
          if (t.includes('morning')) return 'Morning'
          if (t.includes('afternoon')) return 'Afternoon'
          if (t.includes('evening')) return 'Evening'
          if (t.includes('night')) return 'Before bed'
          return ''
        })()

        const explicitBrand = String((details as any)?.brandName || '').trim()
        const parsedFromName = (() => {
          const nm = String((details as any)?.name || '').trim()
          const idx = nm.indexOf(',')
          if (idx > 0) return nm.slice(0, idx).trim()
          return ''
        })()
        const brand = explicitBrand || parsedFromName

        const payload = { 
          name: details.name,
          monthly_cost_usd: Math.min(80, Math.max(0, Number(details.monthlyCost || 0))),
          primary_goal_tags: Array.isArray(details.primaryGoals) ? details.primaryGoals : [],
          ...(doseText ? { dose: doseText } : {}),
          ...(timingLabel ? { timing: timingLabel, time_of_day: timingLabel } : {}),
          // Default to daily for My Stack display; user can edit later
          frequency: 'daily',
          ...(brand ? { brand } : {}),
          ...(details.startedAt ? { startDate: String(details.startedAt).slice(0, 10) } : {}),
          ...(details.isActive === false && details.stoppedAt ? { endDate: String(details.stoppedAt).slice(0, 10) } : {})
        }
        // eslint-disable-next-line no-console
        console.log('POSTING (onboarding):', payload)
        const create = await fetch('/api/supplements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const created = await create.json().catch(() => ({}))
        if (create.ok && created?.id) {
          // Create initial period if start date provided
          if (details.startedAt) {
            try {
              await fetch(`/api/supplements/${encodeURIComponent(created.id)}/periods`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  // API expects snake_case keys
                  start_date: String(details.startedAt).slice(0, 10),
                  end_date: details.isActive === false && details.stoppedAt ? String(details.stoppedAt).slice(0, 10) : null
                })
              })
            } catch {}
          }
        } else {
          console.warn('Failed to persist supplement:', created?.error)
        }
      } catch (e) {
        console.warn('Persist error (non-blocking):', e)
      }

      // Wearable action prompt (one-time) immediately after first supplement is added.
      if (wasEmptyBefore) {
        // Let users know reminders are ON (toast first, then wearable modal).
        try {
          toast('Daily check-in reminders are on', {
            description: "We'll email you when it's time. Miss a day? No stress — just come back when you're ready. You can change this in Settings.",
          } as any)
        } catch {}
      }
    }
    setPendingProduct(null);
    setSearchQuery('');
    setSearchResults([]);
  }

  async function dismissWearableInfo() {
    setSavingWearableFlag(true)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wearable_info_dismissed: true }),
      })
    } catch {}
    setSavingWearableFlag(false)
    setShowWearableInfo(false)
  }

  async function handleContinue() {
    if (supplements.length === 0) return;
    // Persist in session for Step 2
    // eslint-disable-next-line no-console
    console.log('=== CONTINUE CLICKED (Step 1) ===', { supplements })
    sessionStorage.setItem('onboarding_supplements', JSON.stringify(supplements));
    router.push('/onboarding/wearables');
  }

  const totalMonthlyCost = supplements.reduce((sum, s) => sum + s.monthlyCost, 0);

  // Mobile UX: after saving a supplement (and closing the details modal), scroll the "My Supplements" section into view.
  useEffect(() => {
    if (pendingProduct) return
    if (supplements.length <= 0) return
    try {
      mySuppsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {}
  }, [supplements.length, pendingProduct])

  // Mobile UX: when quick-add/search populates results, scroll them into view so users don't miss them.
  useEffect(() => {
    if (pendingProduct) return
    if (!isSearching && searchResults.length === 0) return
    try {
      searchResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {}
  }, [isSearching, searchResults.length, pendingProduct])

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/supps.png?v=1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Wearable info modal (first thing after signup) */}
      {showWearableInfo && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 text-center">Want verdicts fast?</h3>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">
              If you use Whoop, Oura, Apple Health, or any wearable, you could get your first supplement verdict today — no waiting.
            </p>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">
              Upload your data after adding your supplements and we&apos;ll do the rest.
            </p>
            <div className="mt-5">
              <button
                type="button"
                disabled={savingWearableFlag}
                onClick={dismissWearableInfo}
                className="w-full rounded-xl bg-gray-900 text-white px-4 py-3 text-sm font-semibold hover:bg-gray-800 disabled:opacity-60"
              >
                Got it — let&apos;s add my supplements
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-[760px] mx-auto px-4 py-8 sm:px-6 sm:py-16">
        <div className="rounded-2xl bg-white/95 shadow-sm ring-1 ring-black/[0.04] p-4 sm:p-10 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-none overflow-hidden sm:overflow-visible">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden sm:overflow-visible pr-0 sm:pr-1">
          {/* Header Zone */}
          <div className="mb-6 sm:mb-8">
            <p className="text-base font-medium text-slate-600 mb-2">
              {firstName ? `Welcome to BioStackr, ${firstName}` : 'Welcome to BioStackr'}
            </p>
            <h1 className="text-[32px] sm:text-[40px] font-bold text-slate-900 leading-tight mb-3">
              Let&apos;s look at your stack.
            </h1>
            <p className="text-lg text-slate-600">
              Tell us what you&apos;re taking. We&apos;ll figure out what&apos;s worth keeping.
            </p>
          </div>

          {/* What happens next (micro-guide) */}
          <div className="mb-8 sm:mb-10">
            <div className="text-sm text-slate-500 mb-2">What happens from here:</div>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li>• You add supplements (as many or as few as you want)</li>
              <li>• BioStackr starts watching patterns</li>
              <li>• You get clarity when there’s enough signal</li>
            </ul>
          </div>

          {/* Input Area */}
          <div className="mb-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Add supplements</div>
          <div className="text-sm text-slate-700 mb-2 font-medium">What are you currently taking?</div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim().length > 0) {
                openManualAdd(searchQuery.trim())
              }
            }}
            placeholder="Start with one (e.g. magnesium)"
            className="w-full px-5 py-4 text-base border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
          />
          <div className="mt-2">
            <p className="text-[13px] text-slate-400">Brands and dosages are optional.</p>
          </div>
            
            {/* Common starting points */}
            <div className="text-xs text-slate-500 mt-4 mb-2">Common starting points</div>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
              {['Magnesium', 'Creatine', 'Vitamin D', 'Omega-3', 'Ashwagandha'].map(name => (
                <button
                  key={name}
                  onClick={async () => {
                    const q = String(name || '').trim()
                    setSearchQuery(q)
                    if (q.length < 2) { setSearchResults([]); return }
                    setIsSearching(true)
                    try {
                      const res = await fetch(`/api/supplements/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
                      const data = await res.json()
                      const rows = Array.isArray(data?.results) ? data.results : []
                      const mapped: Product[] = rows.map((row: any) => {
                        const servingsPerContainer = Number(row.servings_per_container ?? 0) || 0;
                        const pricePerServing = Number(row.price_per_serving ?? 0) || 0;
                        const pricePerContainer = servingsPerContainer > 0 ? pricePerServing * servingsPerContainer : 0;
                        return {
                          id: String(row.id),
                          productName: String(row.title ?? ''),
                          brandName: String(row.brand ?? ''),
                          canonicalSupplementId: String(row.id),
                          pricePerContainerDefault: pricePerContainer,
                          servingsPerContainerDefault: servingsPerContainer,
                          dosePerServingAmountDefault: 1,
                          dosePerServingUnitDefault: 'capsules'
                        };
                      });
                      setSearchResults(mapped)
                    } catch (error) {
                      console.error('Search failed:', error)
                    } finally {
                      setIsSearching(false)
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-[#f8f7f4] border border-[#e7e5e0] rounded-full hover:bg-[#f1f0eb] hover:border-[#d4d2cd] transition whitespace-nowrap"
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => openManualAdd(searchQuery.trim() || undefined)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#2C2C2C] text-white hover:bg-black text-sm"
              >
                Add a supplement manually
              </button>
            </div>
          </div>

            {/* Selected supplements (kept near the top on mobile so users can see multiple items as they add them) */}
            {supplements.length > 0 && (
              <div ref={mySuppsRef} className="mt-5 bg-slate-50 rounded-xl border border-slate-300 ring-1 ring-black/5 shadow-sm p-4">
                <h3 className="font-semibold mb-3">
                  My Supplements ({supplements.length})
                </h3>

                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {supplements.map((supp, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{abbreviateSupplementName(String(supp?.name || ''))}</div>
                        <div className="text-sm text-slate-500 truncate">{supp.brandName}</div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                          ${supp.monthlyCost.toFixed(2)}/mo
                        </div>
                        <button
                          onClick={() => { setEditIndex(idx); setPendingProduct({
                            id: supp.productId,
                            productName: supp.name,
                            brandName: supp.brandName,
                            canonicalSupplementId: supp.canonicalSupplementId,
                            pricePerContainerDefault: supp.pricePerContainer ?? 0,
                            servingsPerContainerDefault: supp.servingsPerContainer ?? 0,
                            dosePerServingAmountDefault: supp.dailyDose ?? 1,
                            dosePerServingUnitDefault: supp.doseUnit ?? ''
                          })}}
                          className="text-sm text-slate-600 hover:text-slate-800 transition-colors whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeSupplement(idx)}
                          className="text-sm text-slate-600 hover:text-red-600 transition-colors whitespace-nowrap"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total monthly cost:</span>
                  <span className="text-lg font-bold text-slate-900">
                    ${totalMonthlyCost.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Search results */}
          <div ref={searchResultsRef} />
          {isSearching && (
            <div className="text-center py-8 text-slate-500">Searching...</div>
          )}
          
          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-3 mb-8">
              {searchResults.map(product => (
                <div 
                  key={product.id} 
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{product.brandName} {product.productName}</h3>
                      <div className="mt-1 text-sm text-slate-600">
                        <span className="mr-3">£{(product.pricePerContainerDefault > 0 && product.servingsPerContainerDefault > 0
                          ? (product.pricePerContainerDefault / product.servingsPerContainerDefault).toFixed(2)
                          : '—')}/serving</span>
                        <span className="text-slate-500">{product.servingsPerContainerDefault || 0} servings</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => addSupplement(product)}
                      className="ml-4 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          </div>

          {/* CTA (footer stays visible on mobile) */}
          <div className="pt-4 mt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white/95">
            <div className="flex flex-col">
              <a href="/onboarding/wearables" className="text-slate-600 text-sm">I’ll add these later</a>
              <span className="mt-1 text-xs text-slate-400">You can always update this from your dashboard.</span>
            </div>
            <button
              onClick={handleContinue}
              disabled={supplements.length === 0}
              className="w-full sm:w-auto px-5 py-3 bg-black text-white rounded-full text-sm font-semibold whitespace-nowrap disabled:bg-black disabled:text-white disabled:opacity-80 disabled:cursor-not-allowed hover:bg-zinc-900 transition-colors"
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>
      {pendingProduct && (
        <SupplementDetailsModal
          product={pendingProduct}
          initial={editIndex != null ? supplements[editIndex] : undefined}
          onCancel={() => { setPendingProduct(null); setEditIndex(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}


