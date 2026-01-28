'use client';
import { useEffect, useState } from 'react';
import CarCard from '../../components/CarCard';
import SkeletonCard from '../../components/SkeletonCard';
import { useClientState } from '../../lib/clientState';
import Link from 'next/link';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [financeApps, setFinanceApps] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const { favoriteIds, compareIds, toggleCompare, toggleFavorite } = useClientState();

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setUser(null); setLoading(false); return; }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. User Profile
      const meRes = await fetch(`${apiBase}/api/users/me`, { headers });
      if (!meRes.ok) throw new Error('Failed to load user');
      const userData = await meRes.json();
      setUser(userData);

      // Parallel fetch for other data
      const [favRes, svcRes, finRes, tdRes, ssRes, prRes] = await Promise.all([
        fetch(`${apiBase}/api/users/me/favorites`, { headers }),
        fetch(`${apiBase}/api/service/user/${userData.id}`, { headers }),
        fetch(`${apiBase}/api/finance/me`, { headers }),
        fetch(`${apiBase}/api/testdrive/me`, { headers }),
        fetch(`${apiBase}/api/saved-searches`, { headers }),
        fetch(`${apiBase}/api/buy/me/list`, { headers })
      ]);

      if (favRes.ok) {
        const data = await favRes.json();
        setFavorites(data.map(f => f.car || { id: f.carId }).filter(c => c.id));
      }
      if (svcRes.ok) setServiceBookings(await svcRes.json());
      if (finRes.ok) setFinanceApps(await finRes.json());
      if (tdRes.ok) setTestDrives(await tdRes.json());
      if (ssRes.ok) setSavedSearches(await ssRes.json());
      if (prRes.ok) {
        const prData = await prRes.json();
        setPurchaseRequests(prData.requests || []);
      }

    } catch (e) {
      console.error('Error loading account data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const logout = () => { localStorage.removeItem('token'); setUser(null); setFavorites([]); };

  const deleteSavedSearch = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${apiBase}/api/saved-searches/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setSavedSearches(prev => prev.filter(s => s.id !== id));
    } catch (e) { console.error('Failed to delete search', e); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="space-y-8 w-full h-full flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-white">My Account</h1>
      {!user && (
        <div className="bg-gray-800/60 border border-gray-700 p-8 rounded max-w-md w-full">
          <p className="text-sm text-gray-300 mb-4">You are not signed in.</p>
          <div className="flex flex-col gap-3">
            <Link href="/login" className="w-full text-center bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-medium text-sm text-white">Sign In</Link>
            <Link href="/register" className="w-full text-center bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-medium text-sm text-white">Create Account</Link>
          </div>
        </div>
      )}
      {user && (
        <div className="w-full max-w-6xl space-y-8">
          {/* Profile Info */}
          <div className="bg-gray-800/60 border border-gray-700 p-6 rounded flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400 mb-1">Signed in as</p>
              <p className="font-semibold text-white text-lg">{user.name}</p>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
            <button onClick={logout} className="px-4 py-2 bg-red-600/80 hover:bg-red-500/80 text-white rounded text-sm transition-colors">Log Out</button>
          </div>

          {/* Grid for Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Service Bookings */}
            <div className="bg-gray-800/40 border border-gray-700 p-6 rounded">
              <h2 className="text-xl font-semibold text-white mb-4">Service Bookings</h2>
              {serviceBookings.length === 0 ? <p className="text-gray-500 text-sm">No bookings found.</p> : (
                <div className="space-y-3">
                  {serviceBookings.map(b => (
                    <div key={b.id} className="bg-gray-900/50 p-3 rounded border border-gray-700/50 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-blue-300">{b.service}</div>
                        <div className="text-xs text-gray-400">{new Date(b.date).toLocaleDateString()} • {b.status}</div>
                      </div>
                      <div className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">{b.bookingCode}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Finance Applications */}
            <div className="bg-gray-800/40 border border-gray-700 p-6 rounded">
              <h2 className="text-xl font-semibold text-white mb-4">Finance Applications</h2>
              {financeApps.length === 0 ? <p className="text-gray-500 text-sm">No applications found.</p> : (
                <div className="space-y-3">
                  {financeApps.map(a => (
                    <div key={a.id} className="bg-gray-900/50 p-3 rounded border border-gray-700/50 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-emerald-300">${a.amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded uppercase ${a.status === 'approved' ? 'bg-emerald-900 text-emerald-200' : a.status === 'rejected' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test Drives */}
            <div className="bg-gray-800/40 border border-gray-700 p-6 rounded">
              <h2 className="text-xl font-semibold text-white mb-4">Test Drives</h2>
              {testDrives.length === 0 ? <p className="text-gray-500 text-sm">No requests found.</p> : (
                <div className="space-y-3">
                  {testDrives.map(t => (
                    <div key={t.id} className="bg-gray-900/50 p-3 rounded border border-gray-700/50">
                      <div className="flex justify-between">
                        <div className="font-medium text-white">Car ID: {t.carId}</div>
                        <span className="text-xs uppercase bg-gray-800 px-2 py-1 rounded text-gray-300">{t.status}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Pref: {new Date(t.preferredDay).toLocaleDateString()} {t.preferredTime}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Searches */}
            <div className="bg-gray-800/40 border border-gray-700 p-6 rounded">
              <h2 className="text-xl font-semibold text-white mb-4">Saved Searches</h2>
              {savedSearches.length === 0 ? <p className="text-gray-500 text-sm">No saved searches.</p> : (
                <div className="space-y-3">
                  {savedSearches.map(s => (
                    <div key={s.id} className="bg-gray-900/50 p-3 rounded border border-gray-700/50 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-white">{s.name}</div>
                        <div className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => deleteSavedSearch(s.id)} className="text-red-400 hover:text-red-300 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase Requests */}
            <div className="bg-gray-800/40 border border-gray-700 p-6 rounded lg:col-span-2">
              <h2 className="text-xl font-semibold text-white mb-4">Purchase Requests</h2>
              {purchaseRequests.length === 0 ? <p className="text-gray-500 text-sm">No purchase requests.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3">Car</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseRequests.map(r => (
                        <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-800/30">
                          <td className="px-4 py-3 font-medium text-white">
                            {r.carSnapshot?.make} {r.carSnapshot?.model} ({r.carSnapshot?.year})
                          </td>
                          <td className="px-4 py-3">{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded uppercase text-xs ${r.status === 'closed' ? 'bg-gray-700 text-gray-300' : 'bg-blue-900 text-blue-200'}`}>{r.status}</span>
                          </td>
                          <td className="px-4 py-3 truncate max-w-xs">{r.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Favorites */}
          <div className="pt-4 border-t border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">My Favorites</h2>
            {favorites.length === 0 ? (
              <p className="text-sm text-gray-500">No favorites yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map(car => (
                  <CarCard key={car.id} car={car} comparedIds={compareIds} favoriteIds={favoriteIds} onToggleCompare={toggleCompare} onToggleFavorite={toggleFavorite} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
