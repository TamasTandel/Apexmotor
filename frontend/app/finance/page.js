'use client';
import { useState, useEffect } from 'react';

export default function FinancePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [amount,setAmount] = useState('');
  const [apps,setApps] = useState([]);
  const [loading,setLoading] = useState(true);
  const [user,setUser] = useState(null);

  useEffect(()=>{ (async()=>{
    if(!token){ setLoading(false); return; }
    try {
      const me = await fetch(`${apiBase}/api/users/me`, { headers:{ Authorization:`Bearer ${token}` }});
      if(me.ok){ const u = await me.json(); setUser(u); }
      const res = await fetch(`${apiBase}/api/finance/me`, { headers:{ Authorization:`Bearer ${token}` }});
      if(res.ok){ setApps(await res.json()); }
    } finally { setLoading(false); }
  })(); },[token]);

  const submit = async e => {
    e.preventDefault();
    if(!amount) return;
    const res = await fetch(`${apiBase}/api/finance`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ amount: parseFloat(amount) }) });
    if(res.ok){ const created = await res.json(); setApps(a=>[created, ...a]); setAmount(''); alert('Application submitted'); } else alert('Failed');
  };

  if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>;
  if (!token) return <div className="min-h-screen bg-gray-900 text-white p-8">Login required.</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Finance Application</h1>
        <form onSubmit={submit} className="max-w-md flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Amount (USD)</label>
            <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" required className="w-full p-2 rounded bg-gray-800 border border-gray-700" />
          </div>
          <button className="bg-blue-600 px-4 py-2 rounded h-10 mt-auto">Apply</button>
        </form>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-3">My Applications</h2>
        <div className="overflow-x-auto border border-gray-700 rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/70 text-gray-300">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Amount</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a=> (
                <tr key={a.id} className="border-t border-gray-700/60">
                  <td className="p-2">{a.id}</td>
                  <td className="p-2">${'{'}a.amount{'}'}</td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide ${a.status==='pending'?'bg-amber-600/40 text-amber-200':a.status==='approved'?'bg-emerald-600/40 text-emerald-200':a.status==='rejected'?'bg-red-600/40 text-red-200':'bg-gray-600/40 text-gray-200'}`}>{a.status}</span></td>
                  <td className="p-2">{new Date(a.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!apps.length && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No applications yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
