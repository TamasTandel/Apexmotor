export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const api = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const routes = ['', '/cars', '/compare', '/service', '/about'].map(p => ({ url: base + p, lastModified: new Date() }));
  try {
    const res = await fetch(`${api}/api/cars?pageSize=100`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const cars = (data.cars || []).map(c => ({ url: `${base}/car/${c.id}`, lastModified: new Date(c.updatedAt || c.createdAt || Date.now()) }));
      return [...routes, ...cars];
    }
  } catch {}
  return routes;
}
