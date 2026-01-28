"use client";
import { useEffect, useState } from 'react';
import AdminLayout from '../layout';

export default function BuyCarsPage(){
  return (
    <AdminLayout>
      <BuyCarsClient />
    </AdminLayout>
  );
}

function BuyCarsClient(){
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  async function load(p=1, st=status){
    setLoading(true);
    const token = localStorage.getItem('token');
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    const qs = new URLSearchParams({ page:String(p), pageSize:'25', ...(st? { status: st }: {}) }).toString();
    const res = await fetch(`${apiBase}/api/buy/admin/list?${qs}`, { headers:{ Authorization:`Bearer ${token}` } });
    if(res.ok){ const data = await res.json(); setList(data.requests); setPage(data.page); setTotalPages(data.totalPages); }
    setLoading(false);
  }
  useEffect(()=>{ load(1); },[]);

  async function mark(id, st){
    const token = localStorage.getItem('token');
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    const res = await fetch(`${apiBase}/api/buy/admin/${id}/status`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ status: st }) });
    if(res.ok) load(page);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Buy Requests</h1>
          <p className="text-xs text-gray-400">Leads from Add to Cart/Buy flow</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={e=>{ setStatus(e.target.value); load(1, e.target.value); }} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-300">
              <tr>
                <th className="p-2">When</th>
                <th className="p-2">Status</th>
                <th className="p-2">User</th>
                <th className="p-2">Contact</th>
                <th className="p-2">Car</th>
                <th className="p-2">More</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(r=> (
                <tr key={r.id} className="border-t border-gray-700">
                  <td className="p-2 text-gray-400">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-2"><span className="px-2 py-0.5 rounded bg-gray-700 text-gray-200 text-[11px] uppercase">{r.status}</span></td>
                  <td className="p-2">{r.name}{r.location? ` • ${r.location}`:''}</td>
                  <td className="p-2"><div className="text-gray-300">{r.email}</div><div className="text-gray-400">{r.phone}</div></td>
                  <td className="p-2">{r.carSnapshot? `${r.carSnapshot.make} ${r.carSnapshot.model} ${r.carSnapshot.year}`: `#${r.carId}`}</td>
                  <td className="p-2 text-gray-400">
                    {r.location && <div>Location: {r.location}</div>}
                    {r.message && <div>Note: {r.message}</div>}
                    {r.carSnapshot && (r.carSnapshot.exShowroomPriceINR || r.carSnapshot.price) && (
                      <div>Price: {r.carSnapshot.exShowroomPriceINR? `₹${r.carSnapshot.exShowroomPriceINR.toLocaleString('en-IN')}`: `$${r.carSnapshot.price}`}</div>
                    )}
                  </td>
                  <td className="p-2 space-x-2">
                    {r.status === 'pending' && (
                      <button onClick={()=>mark(r.id,'contacted')} className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white">Mark Contacted</button>
                    )}
                    {r.status === 'contacted' && (
                      <>
                        <button onClick={()=>sold(r.id)} className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white">Sold</button>
                        <button onClick={()=>mark(r.id,'closed')} className="px-2 py-1 text-xs rounded bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <button disabled={page<=1} onClick={()=>load(page-1)} className="px-2 py-1 rounded bg-gray-800 border border-gray-600 disabled:opacity-40">Prev</button>
        <span className="text-gray-400">Page {page} / {totalPages}</span>
        <button disabled={page>=totalPages} onClick={()=>load(page+1)} className="px-2 py-1 rounded bg-gray-800 border border-gray-600 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
  async function sold(id){
    const token = localStorage.getItem('token');
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    const res = await fetch(`${apiBase}/api/buy/admin/${id}/sold`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
    if(res.ok) load(page);
  }

}
