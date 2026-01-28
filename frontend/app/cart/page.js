"use client";
import { useEffect, useMemo, useState } from 'react';
import { useClientState } from '../../lib/clientState';
import { formatINR, convertUSDToINR, formatUSD } from '../../lib/currency';

export default function CartPage(){
  const { cartIds, removeFromCart, clearCart } = useClientState();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buyCar, setBuyCar] = useState(null);
  const [submittedFor, setSubmittedFor] = useState([]); // carIds that have an open request
  const [history, setHistory] = useState([]);
  const [token, setToken] = useState(null);
  async function refreshHistory(){
    if(!token) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${base}/api/buy/me/list?pageSize=100`, { headers:{ Authorization:`Bearer ${token}` } });
      if(res.ok){ const data = await res.json(); setHistory(Array.isArray(data.requests)? data.requests : []); }
    } catch {}
  }

  useEffect(()=>{
    // hydrate on mount to avoid hydration mismatch
    try { const s = localStorage.getItem('purchaseSubmittedCars'); if (s) setSubmittedFor(JSON.parse(s)||[]); } catch {}
  try { setToken(localStorage.getItem('token') || null); } catch {}
  }, []);
  useEffect(()=>{
    try { localStorage.setItem('purchaseSubmittedCars', JSON.stringify(submittedFor)); } catch {}
  }, [submittedFor]);

  useEffect(()=>{
    (async()=>{
      if (!cartIds.length) { setCars([]); return; }
      setLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/api/cars/compare/list?ids=${cartIds.join(',')}`);
        if(res.ok){ const data = await res.json(); setCars(data.cars || []); }
      } finally { setLoading(false); }
    })();
  }, [cartIds.join(',')]);

  // Load my purchase history (if logged in)
  useEffect(()=>{
    (async()=>{
      if(!token) { setHistory([]); return; }
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/api/buy/me/list?pageSize=100`, { headers:{ Authorization:`Bearer ${token}` } });
        if(res.ok){ const data = await res.json(); setHistory(Array.isArray(data.requests)? data.requests : []); }
      } catch { setHistory([]); }
    })();
  }, [token]);

  const visibleCars = useMemo(()=> (
    history && Array.isArray(history) && history.length
      ? cars.filter(car => !history.some(h => h.carId === car.id && (h.status === 'pending' || h.status === 'sold')))
      : cars
  ), [cars, history]);
  const totalINR = useMemo(()=> visibleCars.reduce((sum,c)=> sum + (c.exShowroomPriceINR || convertUSDToINR(c.price, process.env.NEXT_PUBLIC_USD_TO_INR) || 0), 0), [visibleCars]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Cart</h1>
          <p className="text-sm text-gray-400">{cartIds.length} item{cartIds.length!==1?'s':''}</p>
        </div>
        {cartIds.length>0 && <button onClick={clearCart} className="text-xs px-3 py-1 rounded bg-gray-800 border border-gray-700">Clear</button>}
      </div>

    {loading ? (<p className="text-gray-400">Loading…</p>) : cars.length===0 ? (
        <p className="text-gray-400">Your cart is empty.</p>
      ) : (
        <div className="grid gap-4">
      {visibleCars.map(car => (
            <div key={car.id} className="flex items-center gap-4 bg-gray-900/60 border border-gray-700 rounded p-3">
              <img src={car.image} alt={car.model} className="w-28 h-16 object-cover rounded" />
              <div className="flex-1">
                <div className="font-semibold">{car.make} {car.model} <span className="text-xs text-gray-400">{car.year}</span></div>
                <div className="text-sm text-amber-300">{formatINR(car.exShowroomPriceINR || convertUSDToINR(car.price, process.env.NEXT_PUBLIC_USD_TO_INR))} {car.price!=null && <span className="text-[11px] text-gray-500 ml-2">{formatUSD(car.price)}</span>}</div>
              </div>
              <div className="flex gap-2">
                {submittedFor.includes(car.id) ? (
                  <CancelControls carId={car.id} onDone={()=>setSubmittedFor(s=>s.filter(x=>x!==car.id))} />
                ) : (
                  <>
                    <button onClick={()=>removeFromCart(car.id)} className="px-2 py-1 text-xs rounded bg-gray-800 border border-gray-700">Remove</button>
                    <button onClick={()=>setBuyCar(car)} className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white">Buy</button>
                  </>
                )}
              </div>
            </div>
          ))}
          <div className="flex justify-end text-sm text-gray-300">
            <div className="px-4 py-2 rounded bg-gray-800/60 border border-gray-700">Total: <span className="font-semibold text-amber-300">{formatINR(totalINR)}</span></div>
          </div>
        </div>
      )}

  {buyCar && <BuyModal car={buyCar} onClose={()=>setBuyCar(null)} onSubmitted={()=> { setSubmittedFor(s=> Array.from(new Set([...s, buyCar.id]))); refreshHistory(); } } />}

  {token && (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-3">Purchase history</h2>
      {history.length === 0 ? (
        <p className="text-gray-500 text-sm">No purchases yet.</p>
      ) : (
        <div className="space-y-3">
          {history.map(h => (
            <div key={h.id} className="text-sm text-gray-300 bg-gray-900/50 border border-gray-700 rounded p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{h.carSnapshot? `${h.carSnapshot.make} ${h.carSnapshot.model} ${h.carSnapshot.year}`: `#${h.carId}`}</div>
                  <div className="text-xs text-gray-400">{new Date(h.createdAt).toISOString().replace('T',' ').replace('Z',' UTC')} • {h.status}</div>
                </div>
                <div className="text-xs text-gray-400">{h.location || h.name}</div>
              </div>
              {h.status === 'pending' && (
                <div className="mt-2 flex justify-end">
                  <CancelControls carId={h.carId} onDone={refreshHistory} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )}
    </div>
  );
}

function BuyModal({ car, onClose, onSubmitted }){
  const [form, setForm] = useState({ name:'', email:'', phone:'', location:'', message:'' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token'): null;
  useEffect(()=>{
    // Prefill from saved contact profile
    (async()=>{
      if(!token) return;
      try{
        const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/api/users/me/contact_profile`, { headers:{ Authorization:`Bearer ${token}` } });
        if(res.ok){ const data = await res.json(); setForm(f=>({ ...f, ...data })); }
      } catch {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function update(e){ setForm(f=>({ ...f, [e.target.name]: e.target.value })); }
  async function submit(e){
    e.preventDefault(); if(busy) return; setBusy(true);
    try{
      const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const res = await fetch(`${base}/api/buy`, { method:'POST', headers:{ 'Content-Type':'application/json', ...(token? { Authorization:`Bearer ${token}` } : {}) }, body: JSON.stringify({ carId: car.id, ...form }) });
      const data = await res.json().catch(()=>null);
      if(!res.ok){ throw new Error((data && data.error) || 'Failed'); }
      try {
        const key = 'purchaseRequestMap';
        const cur = JSON.parse(localStorage.getItem(key) || '{}');
        if (data && data.id) {
          cur[String(car.id)] = { id: data.id, cancelKey: data.cancelKey || null };
          localStorage.setItem(key, JSON.stringify(cur));
        }
      } catch {}
      setMsg('Request submitted. Our team will contact you.');
      onSubmitted && onSubmitted();
    }catch(e){ setMsg(`Error: ${e.message}`); }
    finally{ setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded p-5">
        <h3 className="text-lg font-semibold mb-3">Book Purchase • {car.make} {car.model}</h3>
        {msg ? (
          <div className="space-y-4">
            <p className="text-amber-200">{msg}</p>
            <button onClick={onClose} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white w-full">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 text-sm">
            <input name="name" value={form.name} onChange={update} placeholder="Full name" required className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
            <input type="email" name="email" value={form.email} onChange={update} placeholder="Email" required className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
            <input name="phone" value={form.phone} onChange={update} placeholder="Phone" required className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
            <input name="location" value={form.location} onChange={update} placeholder="Location (City)" className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
            <textarea name="message" value={form.message} onChange={update} placeholder="Message / Notes" rows={3} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 px-3 py-2 rounded bg-gray-700">Cancel</button>
              <button disabled={busy} className="flex-1 px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">{busy? 'Submitting…':'Submit'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CancelControls({ carId, onDone }){
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  async function cancel(){
    if(!reason.trim()) return;
    setBusy(true);
    try{
      const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token'): null;
      let res;
      if (token) {
        res = await fetch(`${base}/api/buy/cancel/by-car/${carId}`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ reason }) });
      } else {
        let map = {};
        try { map = JSON.parse(localStorage.getItem('purchaseRequestMap') || '{}'); } catch {}
        const entry = map[String(carId)];
        if (!entry || !entry.id) { setBusy(false); return; }
        res = await fetch(`${base}/api/buy/${entry.id}/cancel`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ reason, cancelKey: entry.cancelKey || undefined }) });
      }
      if(res.ok) { setShow(false); onDone && onDone(); }
    } finally { setBusy(false); }
  }
  return (
    <div className="flex items-center gap-2">
      {!show ? (
        <button onClick={()=>setShow(true)} className="px-2 py-1 text-xs rounded bg-gray-700">Cancel</button>
      ) : (
        <div className="flex items-center gap-2">
          <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs" />
          <button disabled={busy} onClick={cancel} className="px-2 py-1 text-xs rounded bg-red-600 text-white disabled:opacity-50">Confirm</button>
          <button onClick={()=>setShow(false)} className="px-2 py-1 text-xs rounded bg-gray-700">Close</button>
        </div>
      )}
    </div>
  );
}
