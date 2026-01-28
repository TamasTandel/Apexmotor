
import Link from "next/link";
import CategorySectionClient from "../components/CategorySectionClient";
import Reveal from "../components/Reveal";


async function fetchAllForCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000"}/api/cars`, { next: { revalidate: 120 } });
    if (!res.ok) return { cars: [], categories: [] };
    const data = await res.json();
    return { cars: data.cars, categories: data.categories || [] };
  } catch {
    return { cars: [], categories: [] };
  }
}

export default async function Home() {
  const { cars: allCars, categories } = await fetchAllForCategories();
  const priorityCategories = ['Luxury', 'SUV', 'EV', 'Sports', 'Hatchback', 'Sedan', 'Truck', 'Vintage'];
  const ordered = [...new Set([...priorityCategories, ...categories])];
  const categoryBlocks = ordered.map(cat => ({
    cat,
    items: allCars.filter(c => c.category === cat).slice(0, 6)
  })).filter(b => b.items.length > 0);

  return (
    <div className="">


      {/* Hero: full-bleed video, centered content with equal side space */}
      <section
        className="
          relative isolate
          min-h-screen
          w-full
          mx-[calc(50%-50vw)] md:mx-[calc(50%-50dvw)]
          flex items-center p-0 m-0 border-0 rounded-none
          bg-black
        "
      >
        <video
          className="absolute h-[100vh] w-[100vw] object-cover
          "
          src="/intro.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          aria-hidden="true"
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        />
        <Reveal className="m-0 p-0">
          {/* Centered container: equal left/right space */}
          <div className="relative z-10 w-full sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              Find your next dream car
            </h1>
            <p className="mt-4 text-gray-200 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
              Premium selection, transparent pricing, and hassle-free delivery. Browse featured deals or reach out for a custom quote.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link href="/cars" className="group inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-white shadow-lg shadow-blue-900/30 transition-transform transform-gpu hover:scale-105 active:scale-95">
                Browse Cars
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link href="#categories" className="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900/40 px-5 py-3 text-gray-100 hover:bg-gray-900/60 transition-colors">
                Explore Categories
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-md border border-gray-800 bg-gray-950/60 px-5 py-3 text-gray-300 hover:text-white hover:border-gray-700 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Infinite scrolling services row */}
      <div className="relative w-full overflow-x-hidden bg-gray-950 border-y border-gray-800 py-2">
        <div
          className="whitespace-nowrap flex items-center animate-marquee text-base font-semibold text-blue-200 gap-10"
          style={{
            animation: "marquee 22s linear infinite"
          }}
        >
          <span>🚗 Car Sales</span>
          <span>🛠️ Service & Maintenance</span>
          <span>💰 Finance & Loans</span>
          <span>🔄 Car Exchange</span>
          <span>📝 Insurance</span>
          <span>🚚 Home Delivery</span>
          <span>🕵️ Certified Pre-Owned</span>
          <span>📞 24/7 Support</span>
          {/* Repeat for seamless loop */}
          <span>🚗 Car Sales</span>
          <span>🛠️ Service & Maintenance</span>
          <span>💰 Finance & Loans</span>
          <span>🔄 Car Exchange</span>
          <span>📝 Insurance</span>
          <span>🚚 Home Delivery</span>
          <span>🕵️ Certified Pre-Owned</span>
          <span>📞 24/7 Support</span>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* Category Sections (centered container with equal side space) */}
      <Reveal as="section" id="categories" delay={100} className="p-0 m-0">
        <div className="w-full sm:px-6 lg:px-8">
          <CategorySectionClient blocks={categoryBlocks} />
        </div>
      </Reveal>


    </div>
  );
}
