'use client';
import { useEffect, useState } from 'react';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    async function fetchLogs(p) {
        setLoading(true);
        const token = localStorage.getItem('token');
        const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
        try {
            const res = await fetch(`${base}/api/admin/audit?page=${p}&pageSize=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setTotalPages(data.totalPages);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Audit Logs</h2>
                <button onClick={() => fetchLogs(page)} className="text-sm text-blue-400 hover:text-blue-300">Refresh</button>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-900 text-gray-200 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-3">Time</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Actor ID</th>
                            <th className="px-6 py-3">Target</th>
                            <th className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center">Loading logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center">No logs found.</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-900/50 transition-colors">
                                    <td className="px-6 py-3 whitespace-nowrap text-gray-500">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3 font-medium text-blue-300">
                                        {log.action}
                                    </td>
                                    <td className="px-6 py-3 font-mono text-xs">
                                        {log.actorId || 'System'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-xs">
                                            {log.targetType} {log.targetId ? `#${log.targetId.slice(-4)}` : ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-xs font-mono text-gray-500 max-w-xs truncate">
                                        {JSON.stringify(log.metadata)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-4">
                <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 rounded bg-gray-800 disabled:opacity-50 hover:bg-gray-700"
                >
                    Previous
                </button>
                <span className="px-3 py-1 text-gray-500">Page {page} of {totalPages}</span>
                <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 rounded bg-gray-800 disabled:opacity-50 hover:bg-gray-700"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
