'use client';
import { useState } from 'react';

export default function PurchaseRequestClient({ carId, carName }) {
    const [isOpen, setIsOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState(null); // {type, msg}
    const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

    const open = () => setIsOpen(true);
    const close = () => { setIsOpen(false); setStatus(null); };

    const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setStatus(null);

        // Get token if available
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        try {
            const res = await fetch(`${apiBase}/api/buy`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ ...form, carId: parseInt(carId) })
            });

            if (res.ok) {
                setStatus({ type: 'success', msg: 'Request submitted successfully!' });
                setTimeout(close, 2000);
            } else {
                const data = await res.json().catch(() => ({}));
                setStatus({ type: 'error', msg: data.error || 'Failed to submit request.' });
            }
        } catch (err) {
            setStatus({ type: 'error', msg: 'Network error.' });
        }
        setBusy(false);
    };

    return (
        <>
            <button onClick={open} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors">
                Request Purchase
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6 relative shadow-2xl">
                        <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>

                        <h2 className="text-xl font-bold text-white mb-4">Purchase Request</h2>
                        <p className="text-sm text-gray-400 mb-6">Interested in the {carName}? Fill out this form and we'll contact you with the next steps.</p>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Name</label>
                                <input name="name" required value={form.name} onChange={change} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Email</label>
                                <input name="email" type="email" required value={form.email} onChange={change} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Phone</label>
                                <input name="phone" required value={form.phone} onChange={change} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Message (Optional)</label>
                                <textarea name="message" rows={3} value={form.message} onChange={change} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none" />
                            </div>

                            {status && (
                                <div className={`text-sm px-3 py-2 rounded ${status.type === 'success' ? 'bg-emerald-900/50 text-emerald-200' : 'bg-red-900/50 text-red-200'}`}>
                                    {status.msg}
                                </div>
                            )}

                            <button disabled={busy} type="submit" className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition-colors">
                                {busy ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
