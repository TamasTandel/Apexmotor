import CompareClient from './CompareClient';

export const dynamic = 'force-dynamic';

export default async function ComparePage({ searchParams }) {
  const idsParam = searchParams?.ids || '';
  const ids = idsParam.split(',').map(x=>x.trim()).filter(Boolean).slice(0,3);
  let cars = [];
  if (ids.length) {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${base}/api/cars/compare/list?ids=${ids.join(',')}`, { cache:'no-store' });
      if (res.ok) {
        const data = await res.json();
        cars = data.cars || [];
      }
    } catch {}
  }
  return <CompareClient initialCars={cars} />;
}
