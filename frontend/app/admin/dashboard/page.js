"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard(){
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const [data,setData] = useState(null);
  useEffect(()=>{ fetch(`${apiBase}/api/admin/analytics`).then(r=>r.json()).then(setData); },[]);
  const cards = data ? [
    { label:'Cars', value:data.cars, href:'/admin/cars' },
    { label:'Users', value:data.users, href:'/admin/users' },
    { label:'Service Bookings', value:data.serviceBookings, href:'/admin/service' },
    { label:'Finance Apps', value:data.financeApplications, href:'/admin/finance' },
    { label:'Buy Requests', value:data.buyRequests ?? '—', href:'/admin/buy_cars' },
  ]: [];
  return (
    <div className="p-8 text-white space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c=> (
          <Link key={c.label} href={c.href} className="group bg-gray-900/70 border border-gray-700 rounded-lg p-4 hover:border-blue-500/60 transition-colors flex flex-col">
            <span className="text-sm text-gray-400">{c.label}</span>
            <span className="text-3xl font-bold mt-2 tracking-tight group-hover:text-blue-400">{c.value}</span>
          </Link>
        ))}
        {!data && <div className="text-gray-500 col-span-full">Loading metrics...</div>}
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
          <h2 className="font-semibold mb-2 text-sm text-gray-300">Quick Links</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-blue-400 hover:underline" href="/admin/cars">Manage Cars</Link></li>
            <li><Link className="text-blue-400 hover:underline" href="/admin/users">Manage Users</Link></li>
            <li><Link className="text-blue-400 hover:underline" href="/admin/finance">Finance Review</Link></li>
            <li><Link className="text-blue-400 hover:underline" href="/admin/buy_cars">Buy Requests</Link></li>
            <li><Link className="text-blue-400 hover:underline" href="/admin/notifications">Notifications</Link></li>
            <li><Link className="text-blue-400 hover:underline" href="/admin/audit">Audit Logs</Link></li>
          </ul>
        </div>
        <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
          <h2 className="font-semibold mb-2 text-sm text-gray-300">Next Steps</h2>
          <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
            <li>Add charts (traffic, conversions).</li>
            <li>Integrate notification worker delivery.</li>
            <li>Expand audit events (service updates).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
