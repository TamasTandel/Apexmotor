"use client";
import { useState } from 'react';

export default function SaveSearchButton({ criteria }){
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const click = async ()=>{
    if (!token) { alert('Please login to save searches'); return; }
    setBusy(true);
    try {
  // normalize criteria into URLSearchParams (supports URLSearchParams, array of pairs, or object)
  let sp;
  try { sp = new URLSearchParams(criteria); } catch { sp = new URLSearchParams(); }
  const name = sp.toString() || 'My Search';
  const res = await fetch(`${apiBase}/api/saved-searches`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ name, criteria: Object.fromEntries(sp.entries()) }) });
      if (res.ok) setSaved(true);
    } finally { setBusy(false); }
  };
  return (
    <button onClick={click} disabled={busy || saved} className={`px-3 py-2 rounded border text-sm ${saved? 'bg-emerald-700/60 border-emerald-500/40 text-emerald-100':'bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700'}`}>
      {saved? 'Saved' : (busy ? 'Saving...' : 'Save this search')}
    </button>
  );
}
