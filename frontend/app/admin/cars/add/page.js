"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAddCarPage(){
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const [token, setToken] = useState(null);
  const [form, setForm] = useState({ make:'', model:'', year:'', price:'', image:'', bodyType:'', category:'', exShowroomPriceINR:'', saleStatus:'for_sale', region:'US' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(()=>{ try { const t = localStorage.getItem('token'); if(t) setToken(t); } catch {} },[]);

  const onChange = (k,v)=> setForm(f=>({ ...f, [k]: v }));

  const submit = async (e)=>{
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        year: form.year ? parseInt(form.year) : undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        image: form.image.trim() || undefined,
        bodyType: form.bodyType.trim() || undefined,
        category: form.category.trim() || undefined,
        exShowroomPriceINR: form.exShowroomPriceINR ? parseInt(form.exShowroomPriceINR) : undefined,
        saleStatus: (form.saleStatus||'for_sale').toLowerCase(),
        region: form.region || 'US'
      };
      const res = await fetch(`${apiBase}/api/cars`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>({ error:'Failed to create car' })); throw new Error(j.error || 'Failed to create car'); }
      const created = await res.json();
      router.push(`/admin/cars`);
    } catch (err){ setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-8 text-white space-y-6">
      <h1 className="text-2xl font-bold">Add Car</h1>
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-4 bg-gray-800/40 p-4 rounded border border-gray-700 text-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Make *</label>
          <input value={form.make} onChange={e=>onChange('make', e.target.value)} required className="bg-gray-900 border border-gray-700 rounded px-2 py-1" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Model *</label>
          <input value={form.model} onChange={e=>onChange('model', e.target.value)} required className="bg-gray-900 border border-gray-700 rounded px-2 py-1" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Year</label>
          <input type="number" value={form.year} onChange={e=>onChange('year', e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Price (USD)</label>
          <input type="number" value={form.price} onChange={e=>onChange('price', e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Ex-Showroom INR</label>
          <input type="number" value={form.exShowroomPriceINR} onChange={e=>onChange('exShowroomPriceINR', e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Body Type</label>
          <input value={form.bodyType} onChange={e=>onChange('bodyType', e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Category</label>
          <input value={form.category} onChange={e=>onChange('category', e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1" />
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-gray-400">Image URL</label>
          <input value={form.image} onChange={e=>onChange('image', e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Region</label>
          <select value={form.region} onChange={e=>onChange('region', e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1">
            <option value="US">US</option>
            <option value="IN">IN</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Sale Status</label>
          <select value={form.saleStatus} onChange={e=>onChange('saleStatus', e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1">
            <option value="for_sale">For Sale</option>
            <option value="sold">Sold</option>
            <option value="reserved">Reserved</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        {error && <div className="md:col-span-2 text-red-400">{error}</div>}
        <div className="md:col-span-2 flex gap-3">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60">{saving? 'Saving...' : 'Add Car'}</button>
          <button type="button" onClick={()=>router.push('/admin/cars')} className="px-4 py-2 rounded bg-gray-700">Cancel</button>
        </div>
      </form>
    </div>
  );
}
