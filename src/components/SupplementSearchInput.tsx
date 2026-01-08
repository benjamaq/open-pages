'use client';

import { useEffect, useRef, useState } from 'react';

type CatalogItem = {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  typical_price?: number | null;
  servings_per_container?: number | null;
  serving_size?: string | null;
  image_url?: string | null;
  iherb_url?: string | null;
};

export default function SupplementSearchInput({ onSelect }: { onSelect?: (item: CatalogItem) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        // Switch to iHerb-backed search
        const res = await fetch(`/api/supplements/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
        const data = await res.json();
        const rows = Array.isArray(data?.results) ? data.results : [];
        // Map API -> CatalogItem shape expected by modal
        const mapped: CatalogItem[] = rows.map((r: any) => {
          const servings = typeof r.servings_per_container === 'number'
            ? r.servings_per_container
            : (r.servings_per_container ? Number(r.servings_per_container) : null)
          const pps = typeof r.price_per_serving === 'number'
            ? r.price_per_serving
            : (r.price_per_serving ? Number(r.price_per_serving) : null)
          const containerPrice = (servings && pps) ? (pps * servings) : null
          return {
            id: String(r.id),
            name: String(r.title ?? ''),
            brand: r.brand ?? undefined,
            category: r.category2 ?? undefined,
            // typical_price is treated as container price by the modal
            typical_price: containerPrice,
            servings_per_container: servings,
            serving_size: undefined,
            image_url: undefined,
            iherb_url: r.url ?? undefined
          }
        });
        setResults(mapped);
        setShowDropdown(true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((p) => (p + 1 < results.length ? p + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((p) => (p - 1 >= 0 ? p - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        e.preventDefault();
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  function handleSelect(item: CatalogItem) {
    setShowDropdown(false);
    setQuery(item.name);
    onSelect?.(item);
  }

  useEffect(() => {
    function handleClickOutside(ev: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(ev.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        placeholder="Search supplement (e.g. magnesium)"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
        onKeyDown={handleKeyDown}
      />

      {showDropdown && (loading || results.length > 0) && (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
          {loading && <div className="px-3 py-2 text-xs text-slate-500">Searching…</div>}
          {!loading && results.map((item, i) => (
            <div
              key={item.id}
              className={`flex cursor-pointer flex-col gap-0.5 px-3 py-2 text-sm ${highlightedIndex === i ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
              onMouseEnter={() => setHighlightedIndex(i)}
              onClick={() => handleSelect(item)}
            >
              <span className="font-medium text-slate-900">{item.name}</span>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{item.brand}</span>
                {(() => {
                  const servings = typeof item.servings_per_container === 'number' ? item.servings_per_container : null
                  const container = typeof item.typical_price === 'number' ? item.typical_price : null
                  const pps = (servings && container) ? (container / servings) : null
                  if (container && servings) {
                    return <span className="text-slate-700">${container.toFixed(2)} ({servings} servings) • ${pps!.toFixed(2)}/serving</span>
                  }
                  if (pps) {
                    return <span className="text-slate-700">${pps.toFixed(2)}/serving</span>
                  }
                  return null
                })()}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                {item.category && <span className="italic">{item.category}</span>}
              </div>
            </div>
          ))}
          {!loading && results.length === 0 && (
            <div className="px-3 py-3 text-sm text-slate-700">
              Can’t find yours? <span className="font-semibold">Add manually</span> below.
            </div>
          )}
        </div>
      )}
    </div>
  )
}


