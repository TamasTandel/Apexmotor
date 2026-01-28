'use client';
import { useEffect, useState } from 'react';

export default function ServiceExtras({ carId }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const [history,setHistory] = useState(null);
  const [recs,setRecs] = useState(null);
  const [loading,setLoading] = useState(false); // start false; only true after we decide to fetch
  const [token,setToken] = useState(null);
  const [mounted,setMounted] = useState(false);

  // Read token after mount to keep server/client HTML consistent
  useEffect(()=>{
    setMounted(true);
    try {
      const t = localStorage.getItem('token');
      if (t) setToken(t);
    } catch {}
  },[]);

  // Fetch data once token known
  useEffect(()=>{
    if (!token) return; // no token => keep showing login prompt
    let cancelled = false;
    (async()=>{
      setLoading(true);
      try {
        const headers = { Authorization:`Bearer ${token}` };
        const [h,r] = await Promise.all([
          fetch(`${apiBase}/api/service/car/${carId}`, { headers }),
          fetch(`${apiBase}/api/service/recommendations/${carId}`, { headers })
        ]);
        if (cancelled) return;
        setHistory(h.ok? await h.json(): []);
        const rd = r.ok? await r.json(): { recommendations: [] };
        setRecs(rd.recommendations||[]);
      } catch {
        if (!cancelled){ setHistory([]); setRecs([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return ()=>{ cancelled = true; };
  },[token, carId, apiBase]);

  return (
    <div className="mt-10 space-y-6" suppressHydrationWarning>
      <div className="bg-gray-800/40 border border-gray-700 rounded p-4">
        <h2 className="text-xl font-semibold mb-2">Service History</h2>
        {!token && <p className="text-sm text-gray-400">Log in to view service history & recommendations.</p>}
        {token && loading && <p className="text-sm text-gray-400">Loading...</p>}
        {token && !loading && history && !history.length && <p className="text-gray-500 text-sm">No completed services.</p>}
        {token && !loading && history && history.length>0 && (
          <table className="w-full text-xs">
            <thead><tr><th className="text-left p-1">Date</th><th className="text-left p-1">Service</th><th className="text-left p-1">Type</th></tr></thead>
            <tbody>
              {history.map(h=>(
                <tr key={h.id} className="border-t border-gray-700/60">
                  <td className="p-1">{new Date(h.date).toLocaleDateString()}</td>
                  <td className="p-1">{h.service}</td>
                  <td className="p-1">{h.serviceType||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="bg-gray-800/40 border border-gray-700 rounded p-4">
        <h2 className="text-xl font-semibold mb-2">Recommended Services</h2>
        {token && loading && <p className="text-sm text-gray-400">Loading...</p>}
        {(!token || (recs && recs.length===0)) && !loading && <p className="text-gray-500 text-sm">{!token? 'Log in to view recommendations.' : 'No recommendations.'}</p>}
        {token && !loading && recs && recs.length>0 && (
          <ul className="list-disc ml-5 space-y-1 text-sm">
            {recs.map(r=> <li key={r.code}><span className="font-medium">{r.label}</span> – <span className="text-gray-400">{r.reason}</span> <a href={`/service?pref=${encodeURIComponent(r.label)}`} className="text-blue-400 hover:underline ml-2 text-xs">Book</a></li>)}
          </ul>
        )}
        <div className="text-[10px] text-gray-500 mt-2">* Service data is personalized and requires login.</div>
      </div>
    </div>
  );
}
