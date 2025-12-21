'use client';

import { useState, useEffect } from 'react';
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

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(searchQuery)}`, { cache: 'no-store' });
        const catalog = await res.json();
        // Map catalog items into Product shape expected by the modal trigger
        const mapped: Product[] = Array.isArray(catalog)
          ? catalog.map((item: any) => ({
              id: String(item.id),
              productName: item.name ?? '',
              brandName: item.brand ?? '',
              canonicalSupplementId: String(item.id),
              pricePerContainerDefault: Number(item.typical_price ?? 0) || 0,
              servingsPerContainerDefault: Number(item.servings_per_container ?? 0) || 0,
              dosePerServingAmountDefault: 1,
              dosePerServingUnitDefault: (typeof item.serving_size === 'string' && item.serving_size.toLowerCase().includes('capsule')) ? 'capsules' : ''
            }))
          : [];
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
      // Persist to backend so dashboard sees it immediately
      try {
        const create = await fetch('/api/supplements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: details.name,
            monthly_cost_usd: Math.min(80, Math.max(0, Number(details.monthlyCost || 0)))
          })
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
                  startDate: details.startedAt,
                  endDate: details.isActive === false && details.stoppedAt ? details.stoppedAt : null
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
    }
    setPendingProduct(null);
    setSearchQuery('');
    setSearchResults([]);
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

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/supps.png?v=1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="relative z-10 max-w-[760px] mx-auto px-6 py-16">
        <div className="rounded-2xl bg-white/95 shadow-sm ring-1 ring-black/[0.04] p-6 sm:p-10">
          {/* Header Zone */}
          <div className="mb-6 sm:mb-8">
            <p className="text-base font-medium text-slate-600 mb-2">
              {firstName ? `Welcome to BioStackr, ${firstName}` : 'Welcome to BioStackr'}
            </p>
            <h1 className="text-[40px] font-bold text-slate-900 leading-tight mb-3">
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
            <div className="text-sm text-slate-700 mb-2 font-medium">What are you currently taking?</div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Start with one (e.g. magnesium)"
              className="w-full px-5 py-4 text-base border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
            />
            <p className="mt-2 text-[13px] text-slate-400">Brands and dosages are optional.</p>
            
            {/* Common starting points */}
            <div className="text-xs text-slate-500 mt-4 mb-2">Common starting points</div>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
              {['Magnesium', 'Creatine', 'Vitamin D', 'Omega-3', 'Ashwagandha'].map(name => (
                <button
                  key={name}
                  onClick={() => setSearchQuery(name)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-[#f8f7f4] border border-[#e7e5e0] rounded-full hover:bg[#f1f0eb] hover:border-[#d4d2cd] transition whitespace-nowrap"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Reassurance line */}
          <div className="mt-6 mb-8 text-[13px] text-slate-400">
            You can change this anytime.
          </div>

          {/* Search results */}
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
                      <h3 className="font-semibold text-slate-900">{product.productName}</h3>
                      <p className="text-sm text-slate-500">{product.brandName}</p>
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

          {/* Selected supplements */}
          {supplements.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-300 ring-1 ring-black/5 shadow-sm p-6 mb-8">
              <h3 className="font-semibold mb-4">
                My Supplements ({supplements.length})
              </h3>
              
              <div className="space-y-3">
                {supplements.map((supp, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                    <div className="font-medium text-slate-900">{abbreviateSupplementName(String(supp?.name || ''))}</div>
                      <div className="text-sm text-slate-500">{supp.brandName}</div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-semibold text-slate-900">
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
                        className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => removeSupplement(idx)}
                        className="text-sm text-slate-500 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
    
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-600">Total monthly cost:</span>
                <span className="text-xl font-bold text-slate-900">
                  ${totalMonthlyCost.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <a href="/onboarding/wearables" className="text-slate-600 text-sm">I’ll add these later</a>
              <span className="mt-1 text-xs text-slate-400">You can always update this from your dashboard.</span>
            </div>
            <button
              onClick={handleContinue}
              disabled={supplements.length === 0}
              className="px-8 py-[14px] bg-slate-900 text-white rounded-full text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
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


