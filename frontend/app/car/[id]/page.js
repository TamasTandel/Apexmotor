import ServiceExtras from './service-extras';
import AddToCartClient from './AddToCartClient';
import SpecsInlineClient from './SpecsInlineClient';
import GalleryClient from './GalleryClient';
import TestDriveRequest from './TestDriveRequest';
import PurchaseRequestClient from './PurchaseRequestClient';
import { formatINR, convertUSDToINR, formatUSD } from '../../../lib/currency';

async function fetchCar(id) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const res = await fetch(`${base}/api/cars/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }) {
  const data = await fetchCar(params.id);
  if (!data) return { title: 'Car Not Found' };
  const { car } = data.car ? data : { car: data };
  return {
    title: `${car.make} ${car.model} – AutoHub`,
    description: `${car.year} ${car.make} ${car.model}${car.bodyType ? ' ' + car.bodyType : ''} listing`,
    openGraph: {
      title: `${car.make} ${car.model}`,
      description: `${car.year} ${car.make} ${car.model}`,
      images: [{ url: car.image, width: 1200, height: 630, alt: `${car.make} ${car.model}` }]
    }
  };
}

export default async function CarDetailPage({ params }) {
  const data = await fetchCar(params.id);
  if (!data) return <div className="text-white p-8">Car not found.</div>;
  const { car, similar = [] } = data.car ? data : { car: data, similar: [] };

  // Determine INR price (prefer stored exShowroomPriceINR for consistency; fallback to conversion)
  const effectiveINR = car.exShowroomPriceINR || convertUSDToINR(car.price, process.env.NEXT_PUBLIC_USD_TO_INR);
  // Helpers for compact INR display (Cr/Lakh) and safe spec extraction
  const formatINRShort = (val) => {
    if (!val && val !== 0) return '₹ —';
    const n = Number(val) || 0;
    const crore = 10000000; // 1 Cr = 1e7
    const lakh = 100000; // 1 Lakh = 1e5
    if (n >= crore) return `₹ ${(n / crore).toFixed(n / crore >= 10 ? 0 : 2)} Cr`;
    if (n >= lakh) return `₹ ${(n / lakh).toFixed(n / lakh >= 10 ? 0 : 1)} Lakh`;
    return formatINR(n);
  };
  const getSpec = (obj, keys) => {
    if (!obj) return undefined;
    for (const k of keys) {
      if (obj[k] != null) return obj[k];
      // allow case-insensitive and underscore variations
      const found = Object.keys(obj).find(x => x.toLowerCase() === k.toLowerCase());
      if (found && obj[found] != null) return obj[found];
    }
    return undefined;
  };
  const specs = car.specs || {};
  const engine = getSpec(specs, ['engine_cc', 'engineCC', 'engine', 'displacement']);
  const power = getSpec(specs, ['power_bhp', 'powerBHP', 'power', 'bhp', 'horsepower']);
  const mileage = getSpec(specs, ['mileage_kmpl', 'mileageKmpl', 'mileage', 'range_km', 'rangeKm']);
  const transmission = getSpec(specs, ['transmission', 'gearbox']);
  const fuel = getSpec(specs, ['fuel', 'fuelType', 'fuel_type']);
  const seats = getSpec(specs, ['seatingCapacity', 'seats', 'seat']);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 sm:p-8">
      {/* Header section: image left, details right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="relative lg:col-span-7 xl:col-span-8">
          <GalleryClient
            primaryImage={car.image}
            images={Array.isArray(car.images) ? car.images : []}
            videos={Array.isArray(car.videos) ? car.videos : []}
            minSlides={4}
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {car.category && <span className="bg-black/60 backdrop-blur text-[11px] px-2 py-1 rounded uppercase tracking-wide border border-white/10">{car.category}</span>}
            {typeof car.authentic === 'boolean' && (
              <span className={`text-[11px] px-2 py-1 rounded uppercase tracking-wide border ${car.authentic ? 'bg-emerald-600/70 border-emerald-400/40 text-emerald-100' : 'bg-amber-600/50 border-amber-400/40 text-amber-100'}`}>{car.authentic ? 'OEM Image' : 'Alt Source'}</span>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <h1 className="text-3xl font-bold leading-tight mb-2 flex flex-wrap items-center gap-3">
            {car.make} {car.model}
            {car.saleStatus && car.saleStatus !== 'for_sale' && (
              <span className={`text-xs font-semibold px-2 py-1 rounded uppercase tracking-wide border ${car.saleStatus === 'sold' ? 'bg-red-700/70 border-red-400/40 text-red-100' : car.saleStatus === 'reserved' ? 'bg-yellow-700/70 border-yellow-400/40 text-yellow-100' : 'bg-gray-700/70 border-gray-400/30 text-gray-200'}`}>{car.saleStatus}</span>
            )}
          </h1>
          <div className="text-sm text-gray-400">Year: {car.year} {car.region && <span className="ml-2">• Region: {car.region}</span>}</div>

          <div className="mt-4 p-4 rounded-lg border border-gray-700 bg-gray-800/50">
            <div className="text-2xl font-bold text-amber-300">{formatINRShort(effectiveINR)}</div>
            <div className="text-xs text-gray-400 mt-1">{(car.saleStatus && car.saleStatus !== 'for_sale') ? 'Last Recorded Price' : 'Ex-Showroom Price (approx.)'}</div>
            <div className="text-sm text-blue-300 mt-1">{formatUSD(car.price)}</div>
            {car.exShowroomPriceINR && car.exShowroomPriceINR !== effectiveINR && (
              <div className="text-[11px] text-gray-500 mt-1">INR shown uses provided ex-showroom price.</div>
            )}

            <div className="mt-4">
              {(!car.saleStatus || car.saleStatus === 'for_sale') ? (
                <div className="flex gap-2">
                  <AddToCartClient carId={car.id} />
                  <PurchaseRequestClient carId={car.id} carName={`${car.make} ${car.model}`} />
                </div>
              ) : (
                <a href="/cars" className="inline-block px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white text-sm">Buy Used {car.make} {car.model} Cars</a>
              )}
            </div>
          </div>

          {/* Test drive request */}
          <TestDriveRequest carId={car.id} />

          {/* Quick spec cards */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {engine && (
              <div className="rounded border border-gray-700 bg-gray-800/50 p-3">
                <div className="text-[11px] uppercase text-gray-400">Engine</div>
                <div className="font-medium">{engine}</div>
              </div>
            )}
            {power && (
              <div className="rounded border border-gray-700 bg-gray-800/50 p-3">
                <div className="text-[11px] uppercase text-gray-400">Power</div>
                <div className="font-medium">{power}</div>
              </div>
            )}
            {mileage && (
              <div className="rounded border border-gray-700 bg-gray-800/50 p-3">
                <div className="text-[11px] uppercase text-gray-400">Mileage</div>
                <div className="font-medium">{mileage}</div>
              </div>
            )}
            {typeof seats !== 'undefined' && (
              <div className="rounded border border-gray-700 bg-gray-800/50 p-3">
                <div className="text-[11px] uppercase text-gray-400">Seating Capacity</div>
                <div className="font-medium">{seats}</div>
              </div>
            )}
            {transmission && (
              <div className="rounded border border-gray-700 bg-gray-800/50 p-3">
                <div className="text-[11px] uppercase text-gray-400">Transmission</div>
                <div className="font-medium">{transmission}</div>
              </div>
            )}
            {fuel && (
              <div className="rounded border border-gray-700 bg-gray-800/50 p-3">
                <div className="text-[11px] uppercase text-gray-400">Fuel</div>
                <div className="font-medium">{fuel}</div>
              </div>
            )}
          </div>
          <SpecsInlineClient specs={car.specs} features={Array.isArray(car.features) ? car.features : []} />
        </div>
      </div>

      {/* Service History & Recommendations */}
      <div className="mt-10">
        <ServiceExtras carId={car.id} />
      </div>

      <script type="application/ld+json" suppressHydrationWarning>{JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Vehicle',
        name: `${car.make} ${car.model}`,
        brand: { '@type': 'Brand', name: car.make },
        model: car.model,
        vehicleModelDate: car.year,
        bodyType: car.bodyType,
        image: car.image,
        offers: [
          { '@type': 'Offer', price: car.price, priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
          effectiveINR ? { '@type': 'Offer', price: effectiveINR, priceCurrency: 'INR', availability: 'https://schema.org/InStock' } : undefined
        ].filter(Boolean)
      })}</script>

      {similar.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Similar Cars</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map(s => (
              <a key={s.id} href={`/car/${s.id}`} className="block group border border-gray-700 rounded-lg p-3 bg-gray-800/40 hover:border-blue-500 transition">
                <div className="h-32 overflow-hidden rounded mb-2 bg-gray-900">
                  <img src={s.image} alt={s.model} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
                <div className="font-semibold text-sm leading-tight">{s.make} {s.model}</div>
                <div className="text-xs text-gray-400 flex gap-2 mt-1 items-center">
                  <span>{s.year}</span>
                  {s.bodyType && <span className="px-2 py-0.5 bg-gray-700/60 rounded-full uppercase tracking-wide">{s.bodyType}</span>}
                </div>
                <div className="mt-1 text-blue-300 font-bold text-sm">{formatUSD(s.price)}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
