"use client";
import { useState, useEffect } from 'react';

export default function EmiCalculator() {
  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(10);
  const [tenure, setTenure] = useState(60);
  const [result, setResult] = useState(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  useEffect(()=>{ (async()=>{
    try { const r = await fetch(`${apiBase}/api/finance/emi?amount=${amount}&rate=${rate}&tenure=${tenure}`); if (r.ok) setResult(await r.json()); } catch {}
  })(); }, [amount, rate, tenure]);
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">EMI Calculator</h1>
      <div className="grid gap-4 max-w-lg">
        <label className="flex items-center justify-between gap-3">Amount (USD)
          <input type="number" className="bg-gray-800 border border-gray-700 rounded p-2 w-40" value={amount} onChange={e=>setAmount(parseFloat(e.target.value||'0'))} />
        </label>
        <label className="flex items-center justify-between gap-3">Annual Rate (%)
          <input type="number" className="bg-gray-800 border border-gray-700 rounded p-2 w-40" value={rate} onChange={e=>setRate(parseFloat(e.target.value||'0'))} />
        </label>
        <label className="flex items-center justify-between gap-3">Tenure (months)
          <input type="number" className="bg-gray-800 border border-gray-700 rounded p-2 w-40" value={tenure} onChange={e=>setTenure(parseInt(e.target.value||'0'))} />
        </label>
      </div>
      {result && (
        <div className="mt-6 p-4 rounded border border-gray-700 bg-gray-800/50">
          <div className="text-xl">Monthly EMI: <span className="text-amber-300 font-bold">${'{'}result.emi{'}'}</span></div>
          <div className="text-sm text-gray-400">Total Interest: ${'{'}result.interest{'}'} | Total Payment: ${'{'}result.total{'}'}</div>
        </div>
      )}
    </div>
  );
}
