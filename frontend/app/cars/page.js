import Filters from './filters';
import ListClient from './ListClient';
import SaveSearchButton from '../../components/SaveSearchButton';
import MobileFilterToggle from '../../components/MobileFilterToggle';


async function fetchData(rawParams) {
  // Next.js may pass a special prototype object; convert safely
  const paramsEntries = Object.entries(rawParams || {}).filter(([k, v]) => typeof v === 'string' && v.length > 0);
  const qs = paramsEntries.length ? new URLSearchParams(paramsEntries).toString() : '';
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const res = await fetch(`${base}/api/cars${qs ? '?' + qs : ''}`, { cache: 'no-store' });
  if (!res.ok) return { cars: [], makes: [], bodyTypes: [], categories: [] };
  return res.json();
}

export default async function CarsPage({ searchParams = {} }) {
  const data = await fetchData(searchParams);
  const { cars, makes, bodyTypes, categories, total } = data;
  return (
    <div className="w-full overflow-x-hidden">
      {/* Centered container, equal L/R space; removes full-bleed that caused h-scroll */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Grid parent: content left, filters right */}
        <div className="grid gap-6 lg:grid-cols-[1fr_clamp(220px,22vw,300px)] min-w-0">
          {/* LEFT: Cars/results (expands to full width when filters are hidden) */}
          <section className="min-w-0">
            {/* Mobile filters toggle */}
            <MobileFilterToggle />


            {/* Results header (sorting, count) */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-0">
              <div>
                <h1 className="text-3xl font-bold mb-2">All Cars</h1>
                <p className="text-sm text-gray-400">{total ?? cars.length} result{(total ?? cars.length) !== 1 && 's'} found</p>
              </div>
            </div>

            {/* Cars grid/list - prevent any inner overflow from creating page scrollbar */}
            <div className="min-w-0 overflow-x-hidden">
              {cars.length === 0 ? (
                <p className="text-gray-500">No cars match your filters.</p>
              ) : <ListClient initialCars={data} />}
            </div>


          </section>

          {/* RIGHT: Filters sidebar (ALL filter controls) */}
          <aside
            data-inventory-filters
            className="hidden lg:block sticky top-20 self-start min-w-0"
            aria-label="Inventory filters"
          >
            <Filters makes={makes} bodyTypes={bodyTypes} categories={categories || []} current={searchParams} />
            {/* Save current filters as a search for notifications */}
            <SaveSearchButton criteria={new URLSearchParams(Object.entries(searchParams || {}))} />
          </aside>
        </div>
      </div>
    </div>
  );
}
