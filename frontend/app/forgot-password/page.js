'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage(){
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const [email,setEmail] = useState('');
  const [sent,setSent] = useState(false);
  const [token,setToken] = useState(''); // demo only (would be emailed)
  const [error,setError] = useState('');
  const submit = async e => {
    e.preventDefault(); setError('');
    if(!email) { setError('Email required'); return; }
    try {
      const res = await fetch(`${apiBase}/api/users/request-reset`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if(res.ok){ setSent(true); if(data.token) setToken(data.token); } else setError(data.error||'Failed');
    } catch { setError('Network error'); }
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">Forgot Password</h1>
        <form onSubmit={submit} className="space-y-4 bg-gray-800/60 p-6 rounded border border-gray-700">
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-3 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button className="w-full bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded font-semibold tracking-wide">Send Reset Link</button>
        </form>
        {sent && (
          <div className="bg-gray-800/60 p-4 rounded border border-gray-700 text-sm space-y-2">
            <p className="text-emerald-300">If that email exists we sent a reset link.</p>
            {token && <p className="text-xs text-gray-400">Demo token (copy & paste on reset page): <span className="font-mono break-all">{token}</span></p>}
            <Link href="/reset-password" className="text-blue-400 hover:underline text-xs">Go to Reset Page</Link>
          </div>
        )}
        <p className="text-center text-sm text-gray-400">Remembered it? <Link href="/login" className="text-blue-400 hover:underline">Back to login</Link></p>
      </div>
    </div>
  );
}
