'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    // Verify admin role
    fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then(user => {
        if (user.role !== 'admin') {
          router.replace('/');
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  if (!authorized) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Verifying access...</div>;

  const navItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Cars List', href: '/admin/cars' },
    { label: 'Add Car', href: '/admin/cars/add' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Service Bookings', href: '/admin/service' },
    { label: 'Finance Applications', href: '/admin/finance' },
    { label: 'Purchase Requests', href: '/admin/buy_cars' },
    { label: 'Contact Leads', href: '/admin/contact-leads' },
    { label: 'Notifications', href: '/admin/notifications' },
    { label: 'Audit Logs', href: '/admin/audit-logs' },
    { label: 'Back to Site', href: '/' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-blue-500">Admin Panel</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 rounded transition-colors ${active ? 'bg-blue-900/40 text-blue-200 border border-blue-800' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
          AutoHub Admin v1.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
