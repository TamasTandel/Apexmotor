'use client';
import { useEffect, useState } from 'react';

export default function AdminUsersPage(){
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  // Defer reading localStorage until after mount to avoid SSR/client divergence
  const [token,setToken] = useState(null);
  const [mounted,setMounted] = useState(false);
  const [filters,setFilters] = useState({ q:'', role:'', page:1 });
  const [data,setData] = useState({ users:[], page:1, totalPages:1, total:0 });
  const [toast,setToast] = useState(null);
  useEffect(()=>{ if (toast) { const t=setTimeout(()=>setToast(null),2500); return ()=>clearTimeout(t);} },[toast]);

  const load = async()=>{
    if(!token) return;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k,v])=>{ if(v) params.set(k,v); });
    const res = await fetch(`${apiBase}/api/users/admin/users?${params.toString()}`, { headers:{ Authorization:`Bearer ${token}` }});
    if(res.ok) setData(await res.json()); else if(res.status===403) setToast({ type:'error', msg:'Forbidden' });
  };
  useEffect(()=>{ load(); },[filters, token]);

  // Mount effect
  useEffect(()=>{
    setMounted(true);
    try { const t = localStorage.getItem('token'); if (t) setToken(t); } catch {}
  },[]);

  const changeRole = async(id, role)=>{
    await fetch(`${apiBase}/api/users/admin/users/${id}/role`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ role }) });
    load(); setToast({ type:'success', msg:'Role updated' });
  };
  const toggleLock = async(u)=>{
    await fetch(`${apiBase}/api/users/admin/users/${u.id}/lock`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ lock: !u.locked }) });
    load(); setToast({ type:'success', msg: u.locked?'Unlocked':'Locked' });
  };

  return (
    <div className="p-8 text-white space-y-6" suppressHydrationWarning>
      <h1 className="text-2xl font-bold">Users (Admin)</h1>
      {!token && mounted && <p className="text-sm text-red-300">Login required.</p>}
      <div className="flex flex-wrap gap-4 items-end bg-gray-800/40 border border-gray-700 p-4 rounded">
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">Search</label>
          <input value={filters.q} onChange={e=>setFilters(f=>({...f, q:e.target.value, page:1}))} placeholder="Name or email" className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">Role</label>
          <select value={filters.role} onChange={e=>setFilters(f=>({...f, role:e.target.value, page:1}))} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm">
            <option value="">All</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="mechanic">Mechanic</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto border border-gray-700 rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/70 text-gray-300">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Last Seen</th>
              <th className="p-2 text-left">Online</th>
              <th className="p-2 text-left">Locked</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mounted && data.users.map(u=> {
              const online = u.lastSeenAt && (Date.now() - new Date(u.lastSeenAt).getTime()) < 5*60*1000;
              return (
                <tr key={u.id} className="border-t border-gray-700/60 hover:bg-gray-800/40">
                  <td className="p-2">{u.id}</td>
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    <select value={u.role} onChange={e=>changeRole(u.id, e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="mechanic">mechanic</option>
                    </select>
                  </td>
                  <td className="p-2">{u.phone||'—'}</td>
                  <td className="p-2">{u.createdAt? new Date(u.createdAt).toLocaleDateString(): '—'}</td>
                  <td className="p-2">{u.lastSeenAt? new Date(u.lastSeenAt).toLocaleTimeString(): '—'}</td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded text-[11px] ${online? 'bg-emerald-600/30 text-emerald-200':'bg-gray-700/40 text-gray-300'}`}>{online? 'ONLINE':'OFFLINE'}</span></td>
                  <td className="p-2">{u.locked? <span className="text-red-400 text-xs font-semibold">LOCKED</span>: <span className="text-emerald-400 text-xs">OK</span>}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={()=>toggleLock(u)} className={`px-2 py-1 rounded text-xs ${u.locked?'bg-emerald-600/40 text-emerald-200':'bg-red-600/40 text-red-200'}`}>{u.locked? 'Unlock':'Lock'}</button>
                  </td>
                </tr>
              );
            })}
            {mounted && !data.users.length && <tr><td colSpan={6} className="p-4 text-center text-gray-500">No users found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span>Page {data.page} / {data.totalPages}</span>
        <button disabled={data.page<=1} onClick={()=>setFilters(f=>({...f,page:f.page-1}))} className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40">Prev</button>
        <button disabled={data.page>=data.totalPages} onClick={()=>setFilters(f=>({...f,page:f.page+1}))} className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40">Next</button>
        <span className="text-gray-500">{data.total} total</span>
      </div>
      {toast && <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded border text-sm z-50 ${toast.type==='success'? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200':toast.type==='error'?'bg-red-900/80 border-red-500/40 text-red-200':'bg-blue-900/80 border-blue-500/40 text-blue-200'}`}>{toast.msg}</div>}
    </div>
  );
}
