"use client";
import { useState } from 'react';

export default function TestDriveRequest({ carId }){
  const [day, setDay] = useState('');
  const [time, setTime] = useState('10:00');
  const [busy, setBusy] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const submit = async (e)=>{
    e.preventDefault();
    if (!day) return alert('Pick a date');
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/testdrive`, { method:'POST', headers:{ 'Content-Type':'application/json', ...(token? { Authorization:`Bearer ${token}`}: {}) }, body: JSON.stringify({ carId, preferredDay: day, preferredTime: time }) });
      if (res.ok) alert('Test drive request submitted!'); else alert('Failed');
    } finally { setBusy(false); }
  };
  return (
    <div className="mt-4 p-4 rounded border border-gray-700 bg-gray-800/50">
      <div className="text-sm font-semibold mb-2">Book a Test Drive</div>
      <form onSubmit={submit} className="grid gap-2">
        <input type="date" value={day} onChange={e=>setDay(e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1" />
        <select value={time} onChange={e=>setTime(e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1">
          {['10:00','11:00','12:00','13:00','14:00','15:00','16:00'].map(t=> <option key={t} value={t}>{t}</option>)}
        </select>
        <button disabled={busy} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm">{busy? 'Submitting...':'Request'}</button>
      </form>
    </div>
  );
}
