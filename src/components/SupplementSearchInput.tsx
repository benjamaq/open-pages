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
        const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
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
                {item.typical_price != null && <span className="text-slate-700">${item.typical_price}</span>}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                {item.servings_per_container != null && <span>{item.servings_per_container} servings</span>}
                {item.category && <span className="italic">{item.category}</span>}
              </div>
            </div>
          ))}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-500">No supplements found.</div>
          )}
        </div>
      )}
    </div>
  )
}


