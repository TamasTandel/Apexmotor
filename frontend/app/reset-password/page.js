'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage(){
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const [form,setForm] = useState({ token:'', password:'', confirm:'' });
  const [done,setDone] = useState(false);
  const [error,setError] = useState('');
  const change = e => { setForm(f=>({ ...f, [e.target.name]: e.target.value })); setError(''); };
  const submit = async e => {
    e.preventDefault(); setError('');
    if(!form.token || !form.password) { setError('Token & password required'); return; }
    if(form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if(form.password.length < 6) { setError('Password too short'); return; }
    try {
      const res = await fetch(`${apiBase}/api/users/reset-password`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ token: form.token, password: form.password }) });
      const data = await res.json();
      if(res.ok){ setDone(true); } else setError(data.error||'Reset failed');
    } catch { setError('Network error'); }
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">Reset Password</h1>
        {!done ? (
          <form onSubmit={submit} className="space-y-4 bg-gray-800/60 p-6 rounded border border-gray-700">
            <input name="token" value={form.token} onChange={change} placeholder="Reset Token" className="w-full p-3 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600" />
            <input name="password" type="password" value={form.password} onChange={change} placeholder="New Password" className="w-full p-3 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600" />
            <input name="confirm" type="password" value={form.confirm} onChange={change} placeholder="Confirm Password" className="w-full p-3 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button className="w-full bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded font-semibold tracking-wide">Reset Password</button>
          </form>
        ) : (
          <div className="bg-gray-800/60 p-6 rounded border border-gray-700 text-center space-y-4">
            <p className="text-emerald-300 font-medium">Password reset successful.</p>
            <Link href="/login" className="inline-block bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-semibold">Login</Link>
          </div>
        )}
        {!done && <p className="text-center text-sm text-gray-400">Need a token? <Link href="/forgot-password" className="text-blue-400 hover:underline">Request reset</Link></p>}
      </div>
    </div>
  );
}
