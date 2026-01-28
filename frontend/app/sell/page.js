'use client';
import { useState, useEffect } from 'react';

export default function SellPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const [form, setForm] = useState({ make: '', model: '', year: '', price: '', image: '', features: '' });
  const [role,setRole] = useState(null);
  const [loading,setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(()=>{
    (async()=>{
      if(!token){ setLoading(false); return; }
      try {
        const res = await fetch(`${apiBase}/api/users/me`, { headers:{ Authorization:`Bearer ${token}` }});
        if(res.ok){ const u = await res.json(); setRole(u.role); }
      } finally { setLoading(false); }
    })();
  },[token]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    if (role !== 'admin') return;
    const res = await fetch(`${apiBase}/api/cars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, year: parseInt(form.year), price: parseFloat(form.price), features: form.features.split(',').map(f=>f.trim()) })
    });
    if (res.ok) {
      alert('Car submitted');
      setForm({ make:'', model:'', year:'', price:'', image:'', features:'' });
    } else {
      alert('Failed (admin only or validation error)');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>;
  if (!token) return <div className="min-h-screen bg-gray-900 text-white p-8">Login required.</div>;
  if (role !== 'admin') return <div className="min-h-screen bg-gray-900 text-white p-8">Access denied (admin only).</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Add a Car (Admin)</h1>
      <form onSubmit={handleSubmit} className="max-w-lg grid gap-3">
        <input name="make" placeholder="Make" className="p-2 rounded bg-gray-800" value={form.make} onChange={handleChange} required />
        <input name="model" placeholder="Model" className="p-2 rounded bg-gray-800" value={form.model} onChange={handleChange} required />
        <input name="year" placeholder="Year" type="number" className="p-2 rounded bg-gray-800" value={form.year} onChange={handleChange} required />
        <input name="price" placeholder="Price (USD)" type="number" className="p-2 rounded bg-gray-800" value={form.price} onChange={handleChange} required />
        <input name="image" placeholder="Image URL (optional)" className="p-2 rounded bg-gray-800" value={form.image} onChange={handleChange} />
        <input name="features" placeholder="Features (comma separated)" className="p-2 rounded bg-gray-800" value={form.features} onChange={handleChange} />
        <button className="bg-blue-600 px-4 py-2 rounded">Submit</button>
      </form>
    </div>
  );
}
