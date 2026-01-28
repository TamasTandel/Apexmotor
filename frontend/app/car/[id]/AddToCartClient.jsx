"use client";
import React from 'react';
import Link from 'next/link';
import { useClientState } from '../../../lib/clientState';

export default function AddToCartClient({ carId }) {
  const { addToCart, cartIds } = useClientState();
  const inCart = !!cartIds?.includes?.(carId);

  if (inCart) {
    return (
      <Link href="/cart" className="px-3 py-1.5 text-sm rounded bg-emerald-700 hover:bg-emerald-600 text-white inline-flex items-center gap-1 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
        View Cart
      </Link>
    );
  }

  return (
    <button onClick={() => addToCart(carId)} className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors">
      Add to Cart
    </button>
  );
}
