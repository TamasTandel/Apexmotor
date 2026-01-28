"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import CarCard from '../../components/CarCard';
import { useClientState } from '../../lib/clientState';
import SkeletonCard from '../../components/SkeletonCard';

export default function ListClient({ initialCars }) {
  const [cars, setCars] = useState(initialCars.cars || initialCars);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialCars.page || 1);
  const [totalPages, setTotalPages] = useState(initialCars.totalPages || 1);
  const { compareIds, favoriteIds, toggleCompare, toggleFavorite } = useClientState();
  // Reset when initialCars changes (e.g., new sort/filter navigation)
  useEffect(()=>{
    setCars(initialCars.cars || initialCars);
    setPage(initialCars.page || 1);
    setTotalPages(initialCars.totalPages || 1);
  }, [initialCars]);
  const sentinelRef = useRef();
  // simple client-side refresh when navigating with back/forward (optional)
  const fetchMore = useCallback(async()=>{
    if (loading || page >= totalPages) return;
    setLoading(true);
    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      params.set('page', page+1);
      params.set('pageSize', params.get('pageSize') || '24');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/cars?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCars(prev => [...prev, ...data.cars]);
        setPage(data.page);
        setTotalPages(data.totalPages);
      }
    } finally { setLoading(false); }
  }, [loading, page, totalPages]);

  useEffect(()=>{
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e=>{ if (e.isIntersecting) fetchMore(); });
    }, { rootMargin:'200px' });
    obs.observe(sentinelRef.current);
    return ()=> obs.disconnect();
  }, [fetchMore]);
  return (
    <>
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-wide text-gray-500">
        <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 bg-emerald-600/70 text-emerald-50 rounded">OEM</span> Official Image</span>
        <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 bg-amber-600/60 text-amber-50 rounded">ALT</span> Alternate/Placeholder</span>
      </div>
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4" aria-busy="true" aria-live="polite">
          {Array.from({length:6}).map((_,i)=>(<SkeletonCard key={i} />))}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {cars.map(c=> (
          <CarCard
            key={c.id}
            car={c}
            comparedIds={compareIds}
            favoriteIds={favoriteIds}
            onToggleCompare={toggleCompare}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
      <div ref={sentinelRef} className="h-10 flex items-center justify-center text-xs text-gray-500">
        {page < totalPages ? 'Loading more...' : 'End of results'}
      </div>
    </>
  );
}
