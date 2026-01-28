"use client";
import { useEffect, useState } from 'react';

export default function NotificationsPage(){
  const [items, setItems] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

  // Ensure consistent server/client HTML by deferring access to localStorage until mounted
  useEffect(() => {
    setMounted(true);
    try {
      const t = localStorage.getItem('token');
      setToken(t);
    } catch {}
  }, []);

  // Load notifications once we have a token on the client
  useEffect(() => {
    if (!mounted || !token) return;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/users/me/notifications?status=sent&pageSize=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.notifications || []);
        }
      } catch {}
    })();
  }, [mounted, token]);

  // During SSR and the very first client render, render a stable shell to avoid hydration mismatches
  if (!mounted) return <div className="min-h-screen bg-gray-900 text-white p-8" aria-busy="true" />;

  if (!token) return <div className="min-h-screen bg-gray-900 text-white p-8">Login required.</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className="border border-gray-700 rounded p-3 bg-gray-800/40">
            <div className="text-xs text-gray-400">
              {new Date(n.createdAt).toLocaleString()}
              <span className="ml-2 px-2 py-0.5 rounded bg-gray-700 text-[10px] uppercase tracking-wide">{n.type}</span>
            </div>
            <pre className="text-xs text-gray-300 mt-1 overflow-x-auto">{JSON.stringify(n.payload, null, 2)}</pre>
          </div>
        ))}
        {!items.length && <div className="text-gray-400">No notifications yet.</div>}
      </div>
    </div>
  );
}
