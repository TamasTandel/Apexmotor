"use client";
import CarCard from './CarCard';
import { useClientState } from '../lib/clientState';
import Reveal from './Reveal';

export default function CategorySectionClient({ blocks }) {
  const { compareIds, favoriteIds, toggleCompare, toggleFavorite } = useClientState();
  return (
    <>
      {blocks.map((block, i) => (
        <Reveal key={block.cat} as="section" className="space-y-6" delay={i*80}>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold">{block.cat} Picks</h2>
              <p className="text-sm text-gray-400">Top {block.cat.toLowerCase()} vehicles</p>
            </div>
            <a href={`/cars?category=${encodeURIComponent(block.cat)}`} className="text-sm font-medium text-blue-400 hover:text-blue-300">View all →</a>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((car, j) => (
              <Reveal key={car.id} delay={j*60}>
                <CarCard car={car} onToggleCompare={toggleCompare} comparedIds={compareIds} onToggleFavorite={toggleFavorite} favoriteIds={favoriteIds} />
              </Reveal>
            ))}
          </div>
        </Reveal>
      ))}
    </>
  );
}
