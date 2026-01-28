'use client';
import { useEffect, useState } from 'react';

const SERVICE_PRESETS = [
  { name: 'Oil Change', type: 'Maintenance' },
  { name: 'General Inspection', type: 'Inspection' },
  { name: 'Brake Pads Replacement', type: 'Repair' },
  { name: 'Tire Rotation', type: 'Maintenance' },
  { name: 'Interior Detailing', type: 'Detailing' },
  { name: 'Battery Check', type: 'Inspection' }
];

export default function ServicePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const [token,setToken] = useState(null);
  const [mounted,setMounted] = useState(false);
  const [userId, setUserId] = useState('');
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [form, setForm] = useState({ carId: '', customCar: '', service: '', serviceType: '', date: '', notes: '', contactPhone: '', address:'' });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  // Public booking code lookup
  const [lookupCode, setLookupCode] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);

  useEffect(()=>{ setMounted(true); try { const t=localStorage.getItem('token'); if(t) setToken(t); } catch {} },[]);
  useEffect(()=>{ if (toast) { const t=setTimeout(()=>setToast(null),2500); return ()=>clearTimeout(t);} }, [toast]);

  // Simulate fetching logged-in user & their cars (placeholder: grabs all cars and user id from token context later)
  useEffect(()=>{
    (async()=>{
      if (token) {
        try { const r = await fetch(`${apiBase}/api/users/me`, { headers:{ Authorization:`Bearer ${token}` }}); if (r.ok){ const u=await r.json(); setUser(u); setUserId(String(u.id)); } } catch {}
      }
      try { const res = await fetch(`${apiBase}/api/cars?limit=100`); if (res.ok){ const data=await res.json(); setCars(data.cars||data); } } catch {}
    })();
  }, [apiBase, token]);

  const loadBookings = async(uid)=>{
    if (!uid) return; setLoadingBookings(true);
  try { const res = await fetch(`${apiBase}/api/service/user/${uid}`, { headers:{ Authorization:`Bearer ${token}` }}); if (res.ok){ setBookings(await res.json()); } } catch {}
    setLoadingBookings(false);
  };  
  useEffect(()=>{ loadBookings(userId); }, [userId]);

  const updateField = (e)=> setForm(f=> ({ ...f, [e.target.name]: e.target.value }));
  const choosePreset = (p)=> setForm(f=> ({ ...f, service: p.name, serviceType: p.type }));

  const submit = async e => {
    e.preventDefault();
  if (!userId || (!form.carId && !form.customCar.trim()) || !form.service || !form.date) { setToast({ type:'error', msg:'Please fill required fields'}); return; }
    setBusy(true);
    try {
  const payload = { carId: form.carId? Number(form.carId): undefined, service: form.service.trim(), serviceType: form.serviceType, date: form.date, notes: form.notes, contactPhone: form.contactPhone, address: form.address, customCar: form.customCar.trim()||undefined };
      const res = await fetch(`${apiBase}/api/service`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(()=>({ error:'Booking failed'}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setToast({ type:'success', msg:'Service booked' });
  setForm({ carId:'', customCar:'', service:'', serviceType:'', date:'', notes:'', contactPhone:'', address:'' });
      loadBookings(userId);
    } catch (e) { setToast({ type:'error', msg: e.message }); }
    setBusy(false);
  };

  const cancelBooking = async(id)=>{
    try { await fetch(`${apiBase}/api/service/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } }); loadBookings(userId); } catch {}
  };

  const lookup = async(e)=>{
    e.preventDefault();
    if(!lookupCode.trim()) return;
    setLookupBusy(true); setLookupResult(null);
    try {
      const r = await fetch(`${apiBase}/api/service/code/${encodeURIComponent(lookupCode.trim())}`);
      if (r.ok) {
        setLookupResult(await r.json());
      } else {
        const err = await r.json().catch(()=>({ error:'Not found'}));
        setLookupResult({ error: err.error || 'Not found' });
      }
    } catch {
      setLookupResult({ error:'Lookup failed' });
    }
    setLookupBusy(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 space-y-10">
      <h1 className="text-3xl font-bold">Book a Service</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <form onSubmit={submit} className="bg-gray-800/60 border border-gray-700 rounded p-6 space-y-4 lg:col-span-1">
          <h2 className="font-semibold text-lg mb-2">New Booking</h2>
          {mounted && !token && <p className="text-xs text-red-300 bg-red-900/30 border border-red-800 rounded p-2">Log in to book a service.</p>}
          {user && <div className="text-xs text-gray-400">Booking as <span className="text-gray-200 font-medium">{user.name}</span></div>}
          <div className="grid gap-3">
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Car (Select)</label>
                <select name="carId" value={form.carId} onChange={e=> setForm(f=>({...f, carId:e.target.value, customCar: e.target.value? '': f.customCar }))} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm">
                  <option value="">Select car</option>
                  {cars.slice(0,100).map(c=> <option value={c.id} key={c.id}>{c.make} {c.model} ({c.year})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Or Enter Car Make / Model</label>
                <input name="customCar" value={form.customCar} onChange={e=> setForm(f=>({...f, customCar:e.target.value, carId: e.target.value? '': f.carId }))} placeholder="e.g. Maruti Alto 2018" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm" />
                <p className="text-[10px] text-gray-500 mt-1">If not in list, type it. One of Select or Enter is required.</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Date</label>
              <input name="date" type="date" value={form.date} onChange={updateField} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Your Address (optional)</label>
              <textarea name="address" rows={2} value={form.address} onChange={updateField} placeholder="Street, City, PIN" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Quick Presets</p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_PRESETS.map(p=> <button type="button" key={p.name} onClick={()=>choosePreset(p)} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-[11px]">{p.name}</button>)}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Service Title</label>
              <input name="service" placeholder="e.g. Oil Change" value={form.service} onChange={updateField} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Type</label>
              <select name="serviceType" value={form.serviceType} onChange={updateField} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm">
                <option value="">Select type</option>
                <option>Maintenance</option>
                <option>Repair</option>
                <option>Inspection</option>
                <option>Detailing</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Contact Phone</label>
              <input name="contactPhone" placeholder="Phone" value={form.contactPhone} onChange={updateField} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Notes</label>
              <textarea name="notes" rows={3} value={form.notes} onChange={updateField} placeholder="Additional details" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm" />
            </div>
          </div>
          <button disabled={busy || !token} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded py-2 text-sm font-semibold">{busy? 'Booking...':'Book Service'}</button>
        </form>
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={lookup} className="bg-gray-800/60 border border-gray-700 rounded p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Check Booking Status (Code)</label>
              <input value={lookupCode} onChange={e=>setLookupCode(e.target.value)} placeholder="Enter booking code e.g. SV-AB12-CD34-EF56" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm" />
            </div>
            <button disabled={lookupBusy || !lookupCode} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm font-semibold">{lookupBusy? 'Checking...':'Check'}</button>
          </form>
          {lookupResult && (
            <div className="bg-gray-900/70 border border-gray-700 rounded p-4 text-sm">
              {lookupResult.error ? (
                <div className="text-red-400">{lookupResult.error}</div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Booking Code</div>
                  <div className="font-mono text-blue-300 break-all">{lookupResult.bookingCode}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mt-2">Status</div>
                  <div className="font-semibold">{lookupResult.status}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mt-2">Service</div>
                  <div>{lookupResult.service} {lookupResult.serviceType && <span className="text-gray-400">({lookupResult.serviceType})</span>}</div>
                  {lookupResult.date && <div className="text-xs text-gray-400 mt-2">Scheduled: {new Date(lookupResult.date).toLocaleDateString()}</div>}
                  {lookupResult.updatedAt && <div className="text-xs text-gray-400">Updated: {new Date(lookupResult.updatedAt).toLocaleString()}</div>}
                </div>
              )}
            </div>
          )}
          <h2 className="font-semibold text-lg">Upcoming & Past Bookings</h2>
          {loadingBookings ? (
            <div className="text-sm text-gray-400">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-gray-500">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto border border-gray-700 rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/70 text-gray-300">
                  <tr>
                    <th className="p-2 text-left">Code</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Service</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Car</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b=> (
                    <tr key={b.id} className="border-t border-gray-700/60">
                      <td className="p-2 font-mono text-xs">{b.bookingCode||'—'}</td>
                      <td className="p-2">{new Date(b.date).toLocaleDateString()}</td>
                      <td className="p-2">{b.service}</td>
                      <td className="p-2">{b.serviceType||'—'}</td>
                      <td className="p-2">{b.carId}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide ${b.status==='pending'?'bg-amber-600/40 text-amber-200':b.status==='confirmed'?'bg-blue-600/40 text-blue-200':b.status==='completed'?'bg-emerald-600/40 text-emerald-200': 'bg-red-600/40 text-red-200'}`}>{b.status}</span></td>
                      <td className="p-2 flex gap-2">
                        {b.status!=='cancelled' && b.status!=='completed' && (
                          <button onClick={()=>cancelBooking(b.id)} className="text-xs px-2 py-1 rounded bg-red-600/70 hover:bg-red-600">Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded border text-sm z-50 ${toast.type==='success'? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200':toast.type==='error'?'bg-red-900/80 border-red-500/40 text-red-200':'bg-blue-900/80 border-blue-500/40 text-blue-200'}`}>{toast.msg}</div>
      )}
    </div>
  );
}
