"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatINR, convertUSDToINR, formatUSD } from '../lib/currency';
import { useClientState } from '../lib/clientState';

export default function CarCard({ car, onToggleCompare, comparedIds = [], onToggleFavorite, favoriteIds = [] }) {
  const fallback = 'https://placehold.co/640x360/png?text=No+Image';
  let src = (car.image && car.image.startsWith('http')) ? car.image : fallback;
  if (src.includes('via.placeholder.com')) src = src.replace('via.placeholder.com', 'placehold.co');
  const inr = car.exShowroomPriceINR;
  const compared = comparedIds.includes(car.id);
  const favored = favoriteIds.includes(car.id);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [busy, setBusy] = useState(false);
  const { addToCart, cartIds } = useClientState();

  const toggleFav = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!onToggleFavorite) return;
    setBusy(true);
    await onToggleFavorite(car.id, favored);
    setBusy(false);
  };

  const inCart = cartIds.includes(car.id);

  return (
    <Link
      href={`/car/${car.id}`}
      aria-label={`${car.make} ${car.model} details`}
      className="group relative cursor-pointer bg-gray-800/60 border border-gray-700 hover:border-blue-500 rounded-lg p-4 flex flex-col transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900"
    >
      <div className="relative overflow-hidden rounded mb-3 h-40 bg-gray-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
        <div className="absolute top-2 left-2 flex gap-2">
          {car.category && <span className="bg-black/60 backdrop-blur text-[10px] px-2 py-0.5 rounded uppercase tracking-wide border border-white/10">{car.category}</span>}
          {typeof car.authentic === 'boolean' && (
            <span
              title={car.authentic ? 'OEM verified image source' : 'Non-OEM / placeholder source'}
              className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide border ${car.authentic ? 'bg-emerald-600/70 border-emerald-400/40 text-emerald-100' : 'bg-amber-600/50 border-amber-400/40 text-amber-100'}`}
            >{car.authentic ? 'OEM' : 'ALT'}</span>
          )}
          {car.saleStatus && car.saleStatus !== 'for_sale' && (
            <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide border ${car.saleStatus === 'sold' ? 'bg-red-700/70 border-red-400/40 text-red-100' : car.saleStatus === 'reserved' ? 'bg-yellow-700/70 border-yellow-400/40 text-yellow-100' : 'bg-gray-700/70 border-gray-400/30 text-gray-200'}`}>{car.saleStatus}</span>
          )}
        </div>
        <button
          onClick={toggleFav}
          aria-label={favored ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur border ${favored ? 'bg-red-500/80 border-red-400' : 'bg-black/50 border-white/10'} hover:scale-105 transition`}
          disabled={busy}
        >
          <span className="text-xs" suppressHydrationWarning>{mounted && favored ? '♥' : '♡'}</span>
        </button>
      </div>
      <h2 className="text-lg font-semibold leading-tight line-clamp-2">{car.make} {car.model}</h2>
      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
        <span>{car.year}</span>
        {car.bodyType && (
          <span className="px-2 py-0.5 bg-gray-700/60 rounded-full text-[11px] uppercase tracking-wide">
            {car.bodyType}
          </span>
        )}
      </div>
      <div className="mt-2 mb-3 font-bold">
        {(() => {
          const inrValue = inr || convertUSDToINR(car.price, process.env.NEXT_PUBLIC_USD_TO_INR);
          return (
            <>
              <span className="text-amber-400">{formatINR(inrValue)}</span>
              {car.price != null && (
                <span className="block text-[11px] text-gray-400 font-medium">{formatUSD(car.price)}</span>
              )}
            </>
          );
        })()}
      </div>
      <div className="flex items-center justify-between mb-2 text-xs">
        <label className="flex items-center gap-1 cursor-pointer select-none" onClick={e => e.stopPropagation()}>
          <input type="checkbox" className="accent-blue-500" checked={compared} onChange={() => onToggleCompare && onToggleCompare(car.id)} />
          <span className="text-gray-400">Compare</span>
        </label>
        {car.saleStatus === 'for_sale' && (
          inCart ? (
            <Link
              href="/cart"
              onClick={e => e.stopPropagation()}
              className="ml-auto px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-medium tracking-wide flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              View Cart
            </Link>
          ) : (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart(car.id); }}
              className="ml-auto px-2 py-1 bg-blue-600/80 hover:bg-blue-500 text-white rounded text-[11px] font-medium tracking-wide"
            >Add to Cart</button>
          )
        )}
      </div>
      <div className="mt-auto flex flex-wrap gap-1">
        {(car.features || []).slice(0, 3).map(f => (
          <span key={f} className="text-[10px] bg-gray-700/70 px-2 py-1 rounded uppercase tracking-wide">
            {f}
          </span>
        ))}
      </div>
    </Link>
  );
}
