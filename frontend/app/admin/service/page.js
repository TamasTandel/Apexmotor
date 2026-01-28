"use client";
import { useEffect, useState } from 'react';

export default function AdminServicePage(){
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [filters,setFilters] = useState({ status:'', locationId:'', from:'', to:'', page:1 });
  const [data,setData] = useState({ bookings:[], page:1, totalPages:1, total:0 });
  const [locations,setLocations] = useState([]);
  // bulk selection removed per new requirement
  const [toast,setToast] = useState(null);
  const [editing,setEditing] = useState(null); // booking being edited
  const [editData,setEditData] = useState({ status:'', cancelReason:'' });
  const [history,setHistory] = useState([]);
  useEffect(()=>{ if (toast) { const t=setTimeout(()=>setToast(null),2500); return ()=>clearTimeout(t);} },[toast]);

  const load = async()=>{
    if (!token) return;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k,v])=>{ if (v) params.set(k,String(v)); });
    const res = await fetch(`${apiBase}/api/service/admin/list?${params.toString()}`, { headers:{ Authorization:`Bearer ${token}` }});
    if (res.ok){
      const payload = await res.json();
      // If user not included, attempt lightweight enrichment (first page only)
      if (payload.bookings.length && !payload.bookings[0].user) {
        const ids = [...new Set(payload.bookings.map(b=>b.userId))];
        for (const id of ids.slice(0,25)) {
          try { const uRes = await fetch(`${apiBase}/api/users/${id}`, { headers:{ Authorization:`Bearer ${token}` }}); if(uRes.ok){ const u=await uRes.json(); payload.bookings.filter(b=>b.userId===id).forEach(b=>{ b.user={ id:u.id, name:u.name, email:u.email }; }); } } catch {}
        }
      }
      setData(payload);
    } else if (res.status===403) setToast({ type:'error', msg:'Forbidden (admin only)' });
  };
  useEffect(()=>{ load(); },[filters]);
  useEffect(()=>{ (async()=>{ if(token){ const r=await fetch(`${apiBase}/api/service/locations`, { headers:{ Authorization:`Bearer ${token}` }}); if(r.ok) setLocations(await r.json()); } })(); },[token]);

  // bulk update removed; edits now via per-row Edit button

  return (
    <div className="p-8 text-white space-y-6">
      <h1 className="text-2xl font-bold">Service Bookings (Admin)</h1>
      <div className="flex justify-end"><button onClick={()=>{
        fetch(`${apiBase}/api/admin/service/export`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r=>r.blob()).then(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='service-bookings.csv'; a.click(); URL.revokeObjectURL(a.href); });
      }} className="px-3 py-1.5 text-xs rounded bg-gray-700 border border-gray-600">Export CSV</button></div>
      {!token && <p className="text-sm text-red-300">Login required.</p>}
  <div className="flex flex-wrap gap-4 items-end bg-gray-800/40 border border-gray-700 p-4 rounded">
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">Status</label>
          <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value, page:1}))} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm">
            <option value="">All</option>
            {['pending','confirmed','completed','cancelled'].map(s=> <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">Location</label>
          <select value={filters.locationId} onChange={e=>setFilters(f=>({...f,locationId:e.target.value, page:1}))} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm">
            <option value="">All</option>
            {locations.map(l=> <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">From</label>
          <input type="date" value={filters.from} onChange={e=>setFilters(f=>({...f,from:e.target.value, page:1}))} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">To</label>
          <input type="date" value={filters.to} onChange={e=>setFilters(f=>({...f,to:e.target.value, page:1}))} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
        </div>
        {/* bulk action buttons removed */}
      </div>
      <div className="overflow-x-auto border border-gray-700 rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/70 text-gray-300">
            <tr>
              {/* selection checkbox column removed */}
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">Service</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Location</th>
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-left">Contact</th>
              <th className="p-2 text-left">Car</th>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Edit</th>
            </tr>
          </thead>
          <tbody>
            {data.bookings.map(b=> (
              <tr key={b.id} className="border-t border-gray-700/60 hover:bg-gray-800/40">
                <td className="p-2">{new Date(b.date).toLocaleDateString()}</td>
                <td className="p-2">{b.preferredTime || (b.slotStart ? new Date(b.slotStart).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}): '—')}</td>
                <td className="p-2">{b.service}</td>
                <td className="p-2">{b.serviceType||'—'}</td>
                <td className="p-2"><span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide ${b.status==='pending'?'bg-amber-600/40 text-amber-200':b.status==='confirmed'?'bg-blue-600/40 text-blue-200':b.status==='completed'?'bg-emerald-600/40 text-emerald-200':'bg-red-600/40 text-red-200'}`}>{b.status}</span></td>
                <td className="p-2">{b.locationId || '—'}</td>
                <td className="p-2">{(b.user && (b.user.name || b.user.email)) || b.userName || b.userId}</td>
                <td className="p-2">{b.contactPhone || '—'}</td>
                <td className="p-2">{b.carDisplay || b.carId}</td>
                <td className="p-2 font-mono text-[11px]">{b.bookingCode || '—'}</td>
                <td className="p-2"><button className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600" onClick={async()=>{ setEditing(b.id); setEditData({ status:b.status, cancelReason:'' }); try { const r=await fetch(`${apiBase}/api/service/admin/detail/${b.id}`, { headers:{ Authorization:`Bearer ${token}` }}); if(r.ok){ const d=await r.json(); setHistory(d.history||[]); } } catch {} }}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 text-xs"><span>Page {data.page} / {data.totalPages}</span><button disabled={data.page<=1} onClick={()=>setFilters(f=>({...f,page:f.page-1}))} className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40">Prev</button><button disabled={data.page>=data.totalPages} onClick={()=>setFilters(f=>({...f,page:f.page+1}))} className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40">Next</button><span className="text-gray-500">{data.total} total</span></div>
      {toast && <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded border text-sm z-50 ${toast.type==='success'? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200':toast.type==='error'?'bg-red-900/80 border-red-500/40 text-red-200':'bg-blue-900/80 border-blue-500/40 text-blue-200'}`}>{toast.msg}</div>}
  {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">Edit Booking #{editing}</h2>
            <div className="space-y-4 text-sm">
              {editData.status==='cancelled' && <div className="text-xs text-red-400">Booking is cancelled. No further changes allowed.</div>}
              {editData.status==='completed' && <div className="text-xs text-emerald-400">Booking completed. No further changes allowed.</div>}
              {editData.status!=='cancelled' && editData.status!=='completed' && editData.status!=='confirmed' && (
                <div className="flex gap-3 flex-wrap">
                  <button onClick={()=>setEditData(d=>({...d,status:'confirmed'}))} className="px-3 py-1 rounded bg-blue-600 text-xs">Confirm</button>
                  <button onClick={()=>setEditData(d=>({...d,status:'cancelled'}))} className="px-3 py-1 rounded bg-red-600 text-xs">Cancel</button>
                </div>
              )}
              {editData.status==='confirmed' && (
                <div className="flex gap-3 flex-wrap">
                  <button onClick={()=>setEditData(d=>({...d,status:'completed'}))} className="px-3 py-1 rounded bg-emerald-600 text-xs">Complete</button>
                  <button onClick={()=>setEditData(d=>({...d,status:'cancelled'}))} className="px-3 py-1 rounded bg-red-600 text-xs">Cancel</button>
                </div>
              )}
              {editData.status==='cancelled' && (
                <div>
                  <label className="text-xs text-gray-400 uppercase">Cancel Reason</label>
                  <textarea rows={2} value={editData.cancelReason} onChange={e=>setEditData(d=>({...d,cancelReason:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs" />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2 flex-wrap">
              <button onClick={async()=>{ 
                const payload={ status: editData.status, cancelReason: editData.status==='cancelled'? editData.cancelReason: undefined };
                if (payload.status==='cancelled' && !payload.cancelReason){ alert('Cancel reason required'); return; }
                try {
                  const res = await fetch(`${apiBase}/api/service/${editing}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(payload) });
                  if(!res.ok){ const err=await res.json().catch(()=>({error:'Update failed'})); throw new Error(err.error||'Update failed'); }
                  setToast({ type:'success', msg:'Updated' });
                  setEditing(null);
                  load();
                } catch(e){ setToast({ type:'error', msg:e.message}); }
              }} className="px-4 py-1.5 rounded bg-blue-600 text-sm">Save</button>
              <button onClick={()=>setEditing(null)} className="px-4 py-1.5 rounded bg-gray-700 text-sm">Close</button>
            </div>
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-sm font-semibold mb-2">History</h3>
              {!history.length && <div className="text-xs text-gray-500">No history entries.</div>}
              <ul className="space-y-1 text-xs max-h-40 overflow-y-auto">
                {history.map(h=> <li key={h.id} className="border border-gray-700/60 rounded px-2 py-1 flex justify-between gap-4"><span>{new Date(h.changedAt).toLocaleString()} : <span className="font-semibold">{h.fromStatus||'—'} → {h.toStatus}</span>{h.note && <> — {h.note}</>}</span><span className="text-gray-500">#{h.actorId||'sys'}</span></li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
