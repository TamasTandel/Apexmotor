"use client";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ClientStateCtx = createContext(null);

export function ClientStateProvider({ children }) {
  const [compareIds, setCompareIds] = useState([]); // up to 3
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [toast, setToast] = useState(null); // {msg,type}
  const [cartIds, setCartIds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Load favorites on mount & when token changes or login event dispatched
  const loadFavorites = useCallback(async () => {
    if (!token) { setFavoriteIds([]); return; }
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/users/me/favorites`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        // Backend currently returns an array of car objects (may in future include favorite records)
        // Normalize by checking common possibilities: direct car object (.id), nested .car.id, or explicit carId
        const ids = data.map(f => {
          if (!f) return null;
          // Support both number (SQL) and string (MongoDB) IDs
          if (f.id && (typeof f.id === 'number' || typeof f.id === 'string')) return f.id;
          if (f.car && (typeof f.car.id === 'number' || typeof f.car.id === 'string')) return f.car.id;
          if (f.carId && (typeof f.carId === 'number' || typeof f.carId === 'string')) return f.carId;
          return null;
        }).filter(Boolean);
        setFavoriteIds(ids);
      }
    } catch { }
  }, [token]);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  // Load local lists after mount to avoid hydration mismatches
  useEffect(() => {
    if (loaded) return;
    try { const s = localStorage.getItem('compareIds'); if (s) setCompareIds(JSON.parse(s) || []); } catch { }
    try {
      if (!token) {
        const s2 = localStorage.getItem('favoriteIds'); if (s2) setFavoriteIds(JSON.parse(s2) || []);
      }
    } catch { }
    try { const s3 = localStorage.getItem('cartIds'); if (s3) setCartIds(JSON.parse(s3) || []); } catch { }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = () => loadFavorites();
    window.addEventListener('auth:login', handler);
    window.addEventListener('auth:logout', handler);
    return () => { window.removeEventListener('auth:login', handler); window.removeEventListener('auth:logout', handler); };
  }, [loadFavorites]);

  // Persist lists - ONLY if loaded
  useEffect(() => { if (loaded && typeof window !== 'undefined') localStorage.setItem('compareIds', JSON.stringify(compareIds)); }, [compareIds, loaded]);
  useEffect(() => { if (loaded && typeof window !== 'undefined') localStorage.setItem('favoriteIds', JSON.stringify(favoriteIds)); }, [favoriteIds, loaded]);
  useEffect(() => { if (loaded && typeof window !== 'undefined') localStorage.setItem('cartIds', JSON.stringify(cartIds)); }, [cartIds, loaded]);

  const toggleCompare = useCallback((id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) { setToast({ msg: 'You can compare up to 3 cars.', type: 'warn' }); return prev; }
      return [...prev, id];
    });
  }, []);

  const toggleFavorite = useCallback(async (id, currentlyFav) => {
    if (!token) {
      setToast({ msg: 'Please log in to use favorites', type: 'info' });
      return;
    }
    // optimistic
    setFavoriteIds(prev => currentlyFav ? prev.filter(x => x !== id) : [...prev, id]);
    try {
      const method = currentlyFav ? 'DELETE' : 'POST';
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/users/me/favorites/${id}`, { method, headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed');
      setToast({ msg: currentlyFav ? 'Removed from favorites' : 'Added to favorites', type: 'success' });
    } catch (e) {
      // revert on failure
      setFavoriteIds(prev => currentlyFav ? [...prev, id] : prev.filter(x => x !== id));
      setToast({ msg: 'Action failed', type: 'error' });
    }
  }, [token]);

  const addToCart = useCallback((id) => {
    setCartIds(prev => prev.includes(id) ? prev : [...prev, id]);
    setToast({ msg: 'Added to cart', type: 'success' });
  }, []);
  const removeFromCart = useCallback((id) => {
    setCartIds(prev => prev.filter(x => x !== id));
    setToast({ msg: 'Removed from cart', type: 'success' });
  }, []);
  const clearCart = useCallback(() => { setCartIds([]); setToast({ msg: 'Cart cleared', type: 'info' }); }, []);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); } }, [toast]);

  // Runtime: inject global CSS and hide any footers (including dynamically added)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    // inject global style
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-hide-footer', '1');
    styleEl.textContent = `
      footer { display:none !important; visibility:hidden !important; height:0 !important; padding:0 !important; margin:0 !important; border:0 !important; }
    `;
    document.head.appendChild(styleEl);

    // helper to hide a footer node
    const hideFooter = (node) => {
      if (!node || node.tagName !== 'FOOTER') return;
      node.style.setProperty('display', 'none', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
      node.style.setProperty('height', '0', 'important');
      node.style.setProperty('padding', '0', 'important');
      node.style.setProperty('margin', '0', 'important');
      node.style.setProperty('border', '0', 'important');
      node.setAttribute('hidden', 'hidden');
    };

    // hide any existing footers
    document.querySelectorAll('footer').forEach(hideFooter);

    // observe future DOM changes
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === 1) {
              if (n.tagName === 'FOOTER') hideFooter(n);
              n.querySelectorAll && n.querySelectorAll('footer').forEach(hideFooter);
            }
          });
        } else if (m.type === 'attributes') {
          const t = m.target;
          if (t && t.tagName === 'FOOTER') hideFooter(t);
        }
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

    return () => { mo.disconnect(); styleEl.remove(); };
  }, []);

  return (
    <ClientStateCtx.Provider value={{ compareIds, favoriteIds, toggleCompare, toggleFavorite, cartIds, addToCart, removeFromCart, clearCart }}>
      {/* Global: hide all footers site-wide */}
      <style jsx global>{` footer { display: none !important; } `}</style>
      {children}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 text-sm px-4 py-2 rounded shadow-lg border ${toast.type === 'success' ? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200' :
            toast.type === 'error' ? 'bg-red-900/80 border-red-500/40 text-red-200' :
              toast.type === 'warn' ? 'bg-amber-900/80 border-amber-500/40 text-amber-200' :
                'bg-blue-900/80 border-blue-500/40 text-blue-200'
          }`}>
          {toast.msg}
        </div>
      )}
    </ClientStateCtx.Provider>
  );
}

export function useClientState() {
  return useContext(ClientStateCtx) || { compareIds: [], favoriteIds: [], toggleCompare: () => { }, toggleFavorite: () => { } };
}
