"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [role, setRole] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelIn, setPanelIn] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) { setRole(null); return; }
    (async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${apiBase}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const u = await res.json(); setRole(u.role); } else setRole(null);
      } catch { setRole(null); }
    })();
    const onLogin = () => { // refresh role on auth events
      const t = localStorage.getItem('token');
      if (!t) { setRole(null); return; }
      fetch((process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000') + `/api/users/me`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.ok ? r.json() : null).then(u => setRole(u ? u.role : null));
    };
    window.addEventListener('auth:login', onLogin);
    window.addEventListener('auth:logout', onLogin);
    return () => { window.removeEventListener('auth:login', onLogin); window.removeEventListener('auth:logout', onLogin); };
  }, []);

  // Lightweight unread notifications count
  useEffect(() => {
    let cancelled = false;
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) { setNotifCount(0); return; }
    (async () => {
      try {
        const seenAt = Number(localStorage.getItem('notifSeenAt') || 0);
        // Fetch last few notifications and count those newer than seenAt
        const res = await fetch(`${apiBase}/api/users/me/notifications?pageSize=20`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        const list = data.notifications || [];
        const count = list.filter(n => !seenAt || (n.createdAt && new Date(n.createdAt).getTime() > seenAt)).length;
        if (!cancelled) setNotifCount(count);
      } catch { }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-white">
            Auto<span className="text-blue-500">Hub</span>
          </Link>
          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center space-x-6 text-sm font-medium">
            {/* Home */}
            <li>
              <Link href="/" className={`transition-colors relative group ${pathname === '/' ? 'text-white' : 'text-gray-300 hover:text-white'}`}>
                <span>Home</span>
                <span className={`absolute left-0 -bottom-1 h-px bg-blue-500 transition-all ${pathname === '/' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            </li>
            {/* Inventory */}
            <li>
              <Link href="/cars" className={`transition-colors relative group ${pathname?.startsWith('/cars') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>
                <span>Inventory</span>
                <span className={`absolute left-0 -bottom-1 h-px bg-blue-500 transition-all ${pathname?.startsWith('/cars') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            </li>
            {/* Cart */}
            <li>
              <Link href="/cart" className={`transition-colors relative group ${pathname?.startsWith('/cart') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>
                <span>Cart</span>
                <span className={`absolute left-0 -bottom-1 h-px bg-blue-500 transition-all ${pathname?.startsWith('/cart') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            </li>
            {/* Contact link */}
            <li>
              <Link
                href="/contact"
                className={`transition-colors relative group ${pathname === '/contact' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
              >
                <span>Contact</span>
                <span className={`absolute left-0 -bottom-1 h-px bg-blue-500 transition-all ${pathname === '/contact' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            </li>
            {/* Service */}
            <li>
              <Link href="/service" className={`transition-colors relative group ${pathname?.startsWith('/service') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>
                <span>Service</span>
                <span className={`absolute left-0 -bottom-1 h-px bg-blue-500 transition-all ${pathname?.startsWith('/service') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            </li>
            {/* About */}
            <li>
              <Link href="/about" className={`transition-colors relative group ${pathname?.startsWith('/about') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>
                <span>About</span>
                <span className={`absolute left-0 -bottom-1 h-px bg-blue-500 transition-all ${pathname?.startsWith('/about') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            </li>
            {/* Admin link (only for admins) */}
            {role === 'admin' && (
              <li>
                <Link href="/admin" className={`transition-colors relative group ${pathname?.startsWith('/admin') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>
                  <span>Admin Panel</span>
                  <span className={`absolute left-0 -bottom-1 h-px bg-blue-500 transition-all ${pathname?.startsWith('/admin') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </Link>
              </li>
            )}
            {/* Account (no dropdown) */}
            <li>
              <Link href="/account" className={`transition-colors relative group ${pathname?.startsWith('/account') && !pathname.includes('notifications') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>
                <span>Account</span>
                <span className={`absolute left-0 -bottom-1 h-px bg-blue-500 transition-all ${pathname?.startsWith('/account') && !pathname.includes('notifications') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            </li>
            {/* Notifications (single item, same hover/spacing) */}
            <li>
              <Link
                href="/account/notifications"
                onClick={() => { try { localStorage.setItem('notifSeenAt', String(Date.now())); } catch { } }}
                className={`transition-colors relative group inline-flex items-center ${pathname === '/account/notifications' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
              >
                <span>Notifications</span>
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold" aria-label={`${notifCount} new notifications`}>{notifCount}</span>
                )}
                <span className={`absolute left-0 -bottom-1 h-px bg-blue-500 transition-all ${pathname === '/account/notifications' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            </li>
          </ul>
          {/* Mobile menu button */}
          <button
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-700 text-gray-200 hover:bg-gray-800"
            aria-label="Open menu"
            onClick={() => { setMobileOpen(true); requestAnimationFrame(() => setPanelIn(true)); }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${panelIn ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => { setPanelIn(false); setTimeout(() => setMobileOpen(false), 300); }}
          />

          {/* Panel */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-[280px] bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 ease-out ${panelIn ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="text-lg font-semibold text-white">
                Menu
              </div>
              <button
                className="text-gray-400 hover:text-white"
                aria-label="Close menu"
                onClick={() => { setPanelIn(false); setTimeout(() => setMobileOpen(false), 300); }}
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-65px)]">
              <Link
                href="/"
                onClick={() => { setPanelIn(false); setTimeout(() => setMobileOpen(false), 300); }}
                className="block px-3 py-2 rounded hover:bg-gray-800 text-gray-200 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/cars"
                onClick={() => { setPanelIn(false); setTimeout(() => setMobileOpen(false), 300); }}
                className="block px-3 py-2 rounded hover:bg-gray-800 text-gray-200 transition-colors"
              >
                Inventory
              </Link>
              <Link
                href="/cart"
                onClick={() => { setPanelIn(false); setTimeout(() => setMobileOpen(false), 300); }}
                className="block px-3 py-2 rounded hover:bg-gray-800 text-gray-200 transition-colors"
              >
                Cart
              </Link>
              <Link
                href="/contact"
                onClick={() => { setPanelIn(false); setTimeout(() => setMobileOpen(false), 300); }}
                className="block px-3 py-2 rounded hover:bg-gray-800 text-gray-200 transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/service"
                onClick={() => { setPanelIn(false); setTimeout(() => setMobileOpen(false), 300); }}
                className="block px-3 py-2 rounded hover:bg-gray-800 text-gray-200 transition-colors"
              >
                Service
              </Link>
              <Link
                href="/about"
                onClick={() => { setPanelIn(false); setTimeout(() => setMobileOpen(false), 300); }}
                className="block px-3 py-2 rounded hover:bg-gray-800 text-gray-200 transition-colors"
              >
                About
              </Link>

              {role === 'admin' && (
                <>
                  <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Admin
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => { setPanelIn(false); setTimeout(() => setMobileOpen(false), 300); }}
                    className="block px-3 py-2 rounded hover:bg-gray-800 text-gray-200 transition-colors"
                  >
                    Admin Panel
                  </Link>
                </>
              )}

              <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Account
              </div>
              <Link
                href="/account"
                onClick={() => { setPanelIn(false); setTimeout(() => setMobileOpen(false), 300); }}
                className="block px-3 py-2 rounded hover:bg-gray-800 text-gray-200 transition-colors"
              >
                Profile
              </Link>
              <Link
                href="/account/notifications"
                onClick={() => {
                  try { localStorage.setItem('notifSeenAt', String(Date.now())); } catch { }
                  setPanelIn(false);
                  setTimeout(() => setMobileOpen(false), 300);
                }}
                className="block px-3 py-2 rounded hover:bg-gray-800 text-gray-200 transition-colors flex items-center justify-between"
              >
                <span>Notifications</span>
                {notifCount > 0 && (
                  <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">{notifCount}</span>
                )}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
}