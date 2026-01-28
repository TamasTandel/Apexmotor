"use client";
import { useEffect, useState } from 'react';

export default function AdminCarsPage(){
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const [token,setToken] = useState(null);
  const [filters,setFilters] = useState({ q:'', saleStatus:'', page:1 });
  const [data,setData] = useState({ cars:[], page:1, totalPages:1, total:0 });
  const [editing,setEditing] = useState(null);
  const [toast,setToast] = useState(null);
  useEffect(()=>{ if (toast) { const t=setTimeout(()=>setToast(null),2500); return ()=>clearTimeout(t);} },[toast]);
  useEffect(()=>{ try { const t=localStorage.getItem('token'); if(t) setToken(t);} catch {} },[]);

  const load = async()=>{
    const params = new URLSearchParams();
    if(filters.q) params.set('q', filters.q);
    if(filters.saleStatus) params.set('saleStatus', filters.saleStatus);
    params.set('page', filters.page);
    params.set('pageSize','500');
    const res = await fetch(`${apiBase}/api/cars?${params.toString()}`);
    if(!res.ok) return;
    const j = await res.json();
    setData({ cars: j.cars, page:j.page, totalPages:j.totalPages, total:j.total });
  };
  useEffect(()=>{ if(token) load(); },[filters, token]);

  const startEdit = (car)=>{ setEditing({ ...car }); };
  const updateField = (k,v)=> setEditing(e=>({ ...e, [k]: v }));
  const save = async()=>{
    const id = editing.id;
    const normalizedStatus = (editing.saleStatus||'for_sale').toLowerCase();
    const payload = { make:editing.make, model:editing.model, year:parseInt(editing.year), price:parseFloat(editing.price), saleStatus:normalizedStatus, category:editing.category, bodyType:editing.bodyType, image: editing.image, exShowroomPriceINR: editing.exShowroomPriceINR? parseInt(editing.exShowroomPriceINR): null };
    const res = await fetch(`${apiBase}/api/cars/${id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(payload) });
    if(res.ok){
      setEditing(null); setToast({ type:'success', msg:'Car updated' }); load();
    } else {
      const err = await res.json().catch(()=>({ error:'Update failed' }));
      setToast({ type:'error', msg: err.error || 'Update failed' });
    }
  };

  return (
    <div className="p-8 text-white space-y-6">
      <h1 className="text-2xl font-bold">Cars (Admin)</h1>
      <div className="flex justify-end">
        <a href="/admin/cars/add" className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm">+ Add Car</a>
      </div>
      <div className="flex flex-wrap gap-4 bg-gray-800/40 p-4 rounded border border-gray-700">
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">Search</label>
          <input value={filters.q} onChange={e=>setFilters(f=>({...f,q:e.target.value,page:1}))} placeholder="Make or model" className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-400">Sale Status</label>
          <select value={filters.saleStatus} onChange={e=>setFilters(f=>({...f,saleStatus:e.target.value,page:1}))} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm">
            <option value="">All</option>
            <option value="for_sale">For Sale</option>
            <option value="sold">Sold</option>
            <option value="reserved">Reserved</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto border border-gray-700 rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/70 text-gray-300">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Make</th>
              <th className="p-2 text-left">Model</th>
              <th className="p-2 text-left">Year</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.cars.map(c=> (
              <tr key={c.id} className="border-t border-gray-700/60 hover:bg-gray-800/40">
                <td className="p-2">{c.id}</td>
                <td className="p-2">{c.make}</td>
                <td className="p-2">{c.model}</td>
                <td className="p-2">{c.year}</td>
                <td className="p-2">₹{(c.exShowroomPriceINR || Math.round(c.price*83)).toLocaleString()}</td>
                <td className="p-2 text-xs">{c.saleStatus||'for_sale'}</td>
                <td className="p-2"><button onClick={()=>startEdit(c)} className="px-2 py-1 rounded text-xs bg-blue-600/50 hover:bg-blue-600">Edit</button></td>
              </tr>
            ))}
            {!data.cars.length && <tr><td colSpan={7} className="p-4 text-center text-gray-500">No cars.</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center p-4" onClick={()=>setEditing(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded p-4 w-full max-w-2xl space-y-4" onClick={e=>e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Edit Car #{editing.id}</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Make</label>
                <input value={editing.make} onChange={e=>updateField('make', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Model</label>
                <input value={editing.model} onChange={e=>updateField('model', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Year</label>
                <input type="number" value={editing.year} onChange={e=>updateField('year', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Price (USD)</label>
                <input type="number" value={editing.price} onChange={e=>updateField('price', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Ex-Showroom INR</label>
                <input type="number" value={editing.exShowroomPriceINR||''} onChange={e=>updateField('exShowroomPriceINR', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Sale Status</label>
                <select value={editing.saleStatus||'for_sale'} onChange={e=>updateField('saleStatus', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1">
                  <option value="for_sale">For Sale</option>
                  <option value="sold">Sold</option>
                  <option value="reserved">Reserved</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs text-gray-400">Image URL</label>
                <input value={editing.image} onChange={e=>updateField('image', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1" />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs text-gray-400">Body Type</label>
                <input value={editing.bodyType||''} onChange={e=>updateField('bodyType', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1" />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs text-gray-400">Category</label>
                <input value={editing.category||''} onChange={e=>updateField('category', e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1" />
              </div>
              {/* Future: Features editing */}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={()=>setEditing(null)} className="px-4 py-2 rounded bg-gray-700 text-sm">Cancel</button>
              <button onClick={save} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded border text-sm z-50 ${toast.type==='success'? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200':'bg-red-900/80 border-red-500/40 text-red-200'}`}>{toast.msg}</div>}
    </div>
  );
}
