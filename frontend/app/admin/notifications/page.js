"use client";
import { useEffect, useState } from 'react';

export default function NotificationsAdminPage(){
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token'): null;
  const [filters,setFilters] = useState({ status:'', page:1 });
  const [data,setData] = useState({ notifications:[], page:1, totalPages:1, total:0 });
  const [toast,setToast] = useState(null);
  useEffect(()=>{ if (toast) { const t=setTimeout(()=>setToast(null),2500); return ()=>clearTimeout(t);} },[toast]);
  const load = async()=>{
    if(!token) return;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k,v])=>{ if(v) params.set(k,v); });
    const res = await fetch(`${apiBase}/api/admin/notifications?${params.toString()}`, { headers:{ Authorization:`Bearer ${token}` }});
    if(res.ok) setData(await res.json());
  };
  useEffect(()=>{ load(); },[filters]);
  const resend = async(id)=>{
    await fetch(`${apiBase}/api/admin/notifications/${id}/resend`, { method:'POST', headers:{ Authorization:`Bearer ${token}` }});
    load(); setToast({ type:'success', msg:'Queued resend' });
  };
  return (
    <div className="p-8 text-white space-y-6">
      <h1 className="text-2xl font-bold">Notifications Queue</h1>
      <div className="flex flex-wrap gap-4 bg-gray-800/40 p-4 rounded border border-gray-700">
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">Status</label>
          <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value, page:1}))} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto border border-gray-700 rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/70 text-gray-300">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Sent</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.notifications.map(n=> (
              <tr key={n.id} className="border-t border-gray-700/60 hover:bg-gray-800/40">
                <td className="p-2">{n.id}</td>
                <td className="p-2 text-xs">{n.type}</td>
                <td className="p-2 text-xs">{n.status}</td>
                <td className="p-2 text-xs">{new Date(n.createdAt).toLocaleString()}</td>
                <td className="p-2 text-xs">{n.sentAt ? new Date(n.sentAt).toLocaleString(): '-'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={()=>resend(n.id)} className="px-2 py-1 rounded text-xs bg-blue-600/50 hover:bg-blue-600">Resend</button>
                </td>
              </tr>
            ))}
            {!data.notifications.length && <tr><td colSpan={6} className="p-4 text-center text-gray-500">No notifications.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span>Page {data.page} / {data.totalPages}</span>
        <button disabled={data.page<=1} onClick={()=>setFilters(f=>({...f,page:f.page-1}))} className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40">Prev</button>
        <button disabled={data.page>=data.totalPages} onClick={()=>setFilters(f=>({...f,page:f.page+1}))} className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40">Next</button>
        <span className="text-gray-500">{data.total} total</span>
      </div>
      {toast && <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded border text-sm z-50 ${toast.type==='success'? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200':'bg-red-900/80 border-red-500/40 text-red-200'}`}>{toast.msg}</div>}
    </div>
  );
}
