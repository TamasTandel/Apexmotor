"use client";
import { useState } from 'react';

export default function ContactForm(){
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const [form, setForm] = useState({ name:'', email:'', phone:'', message:'' });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // {type:'success'|'error', msg:string}

  const change = e => setForm(f=> ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault();
    setStatus(null);
    if (!form.name || !form.email) {
      setStatus({ type:'error', msg:'Name and email are required' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/contact`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(form) });
      if (res.ok) {
        setStatus({ type:'success', msg:'Thanks! We will get back to you shortly.' });
        setForm({ name:'', email:'', phone:'', message:'' });
      } else {
        const data = await res.json().catch(()=>({}));
        setStatus({ type:'error', msg: data.error || 'Failed to submit. Please try again.' });
      }
    } catch {
      setStatus({ type:'error', msg:'Network error. Please try again.' });
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="name" required placeholder="Your name" value={form.name} onChange={change} className="bg-gray-900 border border-gray-700 rounded px-3 py-2" />
        <input name="email" type="email" required placeholder="Email" value={form.email} onChange={change} className="bg-gray-900 border border-gray-700 rounded px-3 py-2" />
      </div>
      <div>
        <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={change} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full" />
      </div>
      <div>
        <textarea name="message" rows={4} placeholder="How can we help?" value={form.message} onChange={change} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full" />
      </div>
      {status && (
        <div className={`text-sm px-3 py-2 rounded border ${status.type==='success' ? 'bg-emerald-900/40 border-emerald-600/40 text-emerald-200' : 'bg-red-900/40 border-red-600/40 text-red-200'}`}>
          {status.msg}
        </div>
      )}
      <div>
        <button disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded">
          {busy? 'Sending…':'Send'}
        </button>
      </div>
    </form>
  );
}
