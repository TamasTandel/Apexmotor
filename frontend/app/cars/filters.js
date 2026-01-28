'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Filters({ makes, bodyTypes, categories = [], current }) {
  const router = useRouter();
  const [make, setMake] = useState(current.make || '');
  const [bodyTypesSel, setBodyTypesSel] = useState(current.bodyType ? current.bodyType.split(',') : []);
  const [q, setQ] = useState(current.q || '');
  const [category, setCategory] = useState(current.category || '');
  const [minPrice, setMinPrice] = useState(current.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(current.maxPrice || '');
  const [minPriceINR, setMinPriceINR] = useState(current.minPriceINR || '');
  const [maxPriceINR, setMaxPriceINR] = useState(current.maxPriceINR || '');
  const [sort, setSort] = useState(current.sort || '');
  const debounceRef = useRef();

  useEffect(()=>{ setMake(current.make || ''); setBodyTypesSel(current.bodyType? current.bodyType.split(','):[]); setQ(current.q || ''); setCategory(current.category||''); setMinPrice(current.minPrice||''); setMaxPrice(current.maxPrice||''); setMinPriceINR(current.minPriceINR||''); setMaxPriceINR(current.maxPriceINR||''); setSort(current.sort||''); }, [current.make, current.bodyType, current.q, current.category, current.minPrice, current.maxPrice, current.minPriceINR, current.maxPriceINR, current.sort]);

  // Hydrate from localStorage on first mount
  useEffect(()=>{
    const saved = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('carFilters')||'{}') : {};
    if (Object.keys(saved).length) {
      setMake(saved.make||'');
      setBodyTypesSel(saved.bodyType? saved.bodyType.split(','):[]);
      setQ(saved.q||'');
      setCategory(saved.category||'');
      setMinPrice(saved.minPrice||'');
      setMaxPrice(saved.maxPrice||'');
      setMinPriceINR(saved.minPriceINR||'');
      setMaxPriceINR(saved.maxPriceINR||'');
      setSort(saved.sort||'');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = () => {
    const params = new URLSearchParams();
    if (make) params.set('make', make);
  if (bodyTypesSel.length) params.set('bodyType', bodyTypesSel.join(','));
  if (q) params.set('q', q);
  if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (minPriceINR) params.set('minPriceINR', minPriceINR);
  if (maxPriceINR) params.set('maxPriceINR', maxPriceINR);
  if (sort) params.set('sort', sort);
    const url = '/cars' + (params.toString() ? '?' + params.toString() : '');
    router.push(url);
    if (typeof window !== 'undefined') localStorage.setItem('carFilters', JSON.stringify(Object.fromEntries(params.entries())));
  };
  const clear = () => { router.push('/cars'); if (typeof window !== 'undefined') localStorage.removeItem('carFilters'); };

  // Debounce search apply (on q change)
  useEffect(()=>{
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(()=>{ if (q === (current.q||'')) return; update(); }, 600);
    return () => clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap gap-3 items-end bg-gray-800/40 border border-gray-700 rounded p-4">
      <div className="flex flex-col">
        <label className="text-xs uppercase tracking-wide text-gray-400 mb-1">Make</label>
        <select value={make} onChange={e=>setMake(e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm">
          <option value="">All</option>
          {makes.map(m=> <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="flex flex-col min-w-[140px]">
        <label className="text-xs uppercase tracking-wide text-gray-400 mb-1">Body Types</label>
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {bodyTypes.map(bt => {
            const active = bodyTypesSel.includes(bt);
            return (
              <button type="button" key={bt} onClick={()=> setBodyTypesSel(prev => active ? prev.filter(x=>x!==bt) : [...prev, bt])} className={`px-2 py-1 rounded text-[11px] border ${active? 'bg-blue-600 border-blue-400 text-white':'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'}`}>{bt}</button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col">
        <label className="text-xs uppercase tracking-wide text-gray-400 mb-1">Search</label>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Keyword" className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs uppercase tracking-wide text-gray-400 mb-1">Category</label>
        <select value={category} onChange={e=>setCategory(e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm">
          <option value="">All</option>
          {categories.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex flex-col w-24">
        <label className="text-xs uppercase tracking-wide text-gray-400 mb-1">Min $</label>
        <input value={minPrice} onChange={e=>setMinPrice(e.target.value)} placeholder="Min" className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col w-24">
        <label className="text-xs uppercase tracking-wide text-gray-400 mb-1">Max $</label>
        <input value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="Max" className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col w-28">
        <label className="text-xs uppercase tracking-wide text-gray-400 mb-1">Min ₹</label>
        <input value={minPriceINR} onChange={e=>setMinPriceINR(e.target.value)} placeholder="Min" className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col w-28">
        <label className="text-xs uppercase tracking-wide text-gray-400 mb-1">Max ₹</label>
        <input value={maxPriceINR} onChange={e=>setMaxPriceINR(e.target.value)} placeholder="Max" className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs uppercase tracking-wide text-gray-400 mb-1">Sort</label>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm">
          <option value="">Default</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="newest">Newest</option>
        </select>
      </div>
      <div className="flex gap-2 ml-auto">
  <button onClick={update} className="bg-blue-600 hover:bg-blue-500 text-sm px-3 py-2 rounded">Apply</button>
  <button onClick={clear} className="bg-gray-700 hover:bg-gray-600 text-sm px-3 py-2 rounded">Clear All</button>
      </div>
    </div>
  );
}
