'use client';
import { useEffect, useState } from 'react';
import { formatINR } from '../../lib/currency';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [timeseries, setTimeseries] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Summary Stats
        fetch(`${base}/api/admin/analytics`, { headers })
            .then(res => res.json())
            .then(setStats)
            .catch(console.error);

        // Fetch Timeseries Data
        fetch(`${base}/api/admin/metrics/timeseries?days=30`, { headers })
            .then(res => res.json())
            .then(setTimeseries)
            .catch(console.error);
    }, []);

    if (!stats || !timeseries) return <div className="text-gray-400">Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold">Dashboard</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={formatINR(stats.totalRevenue)} color="bg-emerald-900/40 border-emerald-700 text-emerald-300" />
                <StatCard title="Active Leads" value={stats.activeLeads} color="bg-blue-900/40 border-blue-700 text-blue-300" />
                <StatCard title="Total Users" value={stats.totalUsers} color="bg-purple-900/40 border-purple-700 text-purple-300" />
                <StatCard title="Cars Sold" value={`${stats.soldCars} / ${stats.totalCars}`} color="bg-amber-900/40 border-amber-700 text-amber-300" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard title="User Growth (Last 30 Days)" data={timeseries.users} labels={timeseries.labels} color="bg-purple-500" />
                <ChartCard title="Service Bookings" data={timeseries.serviceBookings} labels={timeseries.labels} color="bg-emerald-500" />
            </div>
        </div>
    );
}

function StatCard({ title, value, color }) {
    return (
        <div className={`p-6 rounded-xl border ${color}`}>
            <div className="text-sm opacity-80 uppercase tracking-wider">{title}</div>
            <div className="text-3xl font-bold mt-2">{value}</div>
        </div>
    );
}

function ChartCard({ title, data, labels, color }) {
    const max = Math.max(...data, 1);
    return (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">{title}</h3>
            <div className="flex items-end gap-1 h-48">
                {data.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative">
                        <div
                            className={`w-full rounded-t ${color} opacity-60 group-hover:opacity-100 transition-all`}
                            style={{ height: `${(val / max) * 100}%` }}
                        ></div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-xs px-2 py-1 rounded whitespace-nowrap z-10 border border-gray-700">
                            {labels[i]}: {val}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                <span>{labels[0]}</span>
                <span>{labels[labels.length - 1]}</span>
            </div>
        </div>
    );
}
