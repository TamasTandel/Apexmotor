'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('All fields required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${apiBase}/api/users/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.href = '/account';
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch { setError('Network error'); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800/60 p-6 rounded border border-gray-700">
          <input name="name" placeholder="Full Name" className="w-full p-3 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600" value={form.name} onChange={handleChange} />
          <input name="email" placeholder="Email" className="w-full p-3 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600" value={form.email} onChange={handleChange} />
          <input name="password" type="password" placeholder="Password" className="w-full p-3 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600" value={form.password} onChange={handleChange} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-3 rounded font-semibold tracking-wide">{loading? 'Creating...':'Register'}</button>
          <div className="flex justify-between text-xs text-gray-400 pt-1">
            <Link href="/login" className="hover:text-blue-400">Already have account?</Link>
            <Link href="/forgot-password" className="hover:text-blue-400">Forgot password</Link>
          </div>
        </form>
        <p className="text-sm text-gray-400 mt-4 text-center">Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Login</Link></p>
      </div>
    </div>
  );
}
