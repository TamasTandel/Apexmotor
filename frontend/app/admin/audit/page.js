"use client";
import { useEffect, useState } from 'react';

export default function AuditLogPage(){
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token'): null;
  const [filters,setFilters] = useState({ action:'', targetType:'', page:1 });
  const [data,setData] = useState({ logs:[], page:1, totalPages:1, total:0 });
  const [selected,setSelected] = useState(null);
  const load = async()=>{
    if(!token) return;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k,v])=>{ if(v) params.set(k,v); });
    const res = await fetch(`${apiBase}/api/admin/audit?${params.toString()}`, { headers:{ Authorization:`Bearer ${token}` }});
    if(res.ok) setData(await res.json());
  };
  useEffect(()=>{ load(); },[filters]);
  return (
    <div className="p-8 text-white space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      {!token && <p className="text-sm text-red-300">Login required.</p>}
      <div className="flex flex-wrap gap-4 bg-gray-800/40 p-4 rounded border border-gray-700">
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">Action</label>
            <input value={filters.action} onChange={e=>setFilters(f=>({...f, action:e.target.value, page:1}))} placeholder="e.g. USER_ROLE_CHANGE" className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">Target Type</label>
            <input value={filters.targetType} onChange={e=>setFilters(f=>({...f, targetType:e.target.value, page:1}))} placeholder="USER / FINANCE" className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
        </div>
      </div>
      <div className="overflow-x-auto border border-gray-700 rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/70 text-gray-300">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Action</th>
              <th className="p-2 text-left">Target</th>
              <th className="p-2 text-left">Actor</th>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">Meta</th>
            </tr>
          </thead>
          <tbody>
            {data.logs.map(l=> (
              <tr key={l.id} className="border-t border-gray-700/60 hover:bg-gray-800/40">
                <td className="p-2">{l.id}</td>
                <td className="p-2 font-mono text-xs">{l.action}</td>
                <td className="p-2 text-xs">{l.targetType}#{l.targetId||'-'}</td>
                <td className="p-2 text-xs">{l.actorId||'-'}</td>
                <td className="p-2 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-2">
                  {l.metadata ? <button onClick={()=>setSelected(l)} className="text-blue-400 underline text-xs">View</button>: <span className="text-gray-500 text-xs">-</span>}
                </td>
              </tr>
            ))}
            {!data.logs.length && <tr><td colSpan={6} className="p-4 text-center text-gray-500">No logs.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span>Page {data.page} / {data.totalPages}</span>
        <button disabled={data.page<=1} onClick={()=>setFilters(f=>({...f,page:f.page-1}))} className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40">Prev</button>
        <button disabled={data.page>=data.totalPages} onClick={()=>setFilters(f=>({...f,page:f.page+1}))} className="px-2 py-1 rounded bg-gray-700 disabled:opacity-40">Next</button>
        <span className="text-gray-500">{data.total} total</span>
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
          <div className="bg-gray-900 border border-gray-700 max-w-lg w-full rounded p-4 space-y-3" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center"><h2 className="font-semibold">Metadata</h2><button onClick={()=>setSelected(null)} className="text-sm text-gray-400 hover:text-white">Close</button></div>
            <pre className="text-xs overflow-x-auto bg-gray-800/60 p-2 rounded max-h-64">{JSON.stringify(selected.metadata, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
