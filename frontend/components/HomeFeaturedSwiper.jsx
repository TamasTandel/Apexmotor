"use client";
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { formatINR, convertUSDToINR, formatUSD } from '../lib/currency';

export default function HomeFeaturedSwiper({ cars = [] }){
  if (!cars || cars.length === 0) return null;
  const slides = cars.map(c => ({
    id: c.id,
    title: `${c.make} ${c.model}`,
    year: c.year,
    image: c.image,
    priceUSD: c.price,
    priceINR: c.exShowroomPriceINR || convertUSDToINR(c.price, process.env.NEXT_PUBLIC_USD_TO_INR),
  }));
  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-800">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        slidesPerView={1}
        className="h-[360px] sm:h-[500px] bg-gray-900"
        style={{ '--swiper-theme-color': '#60a5fa' }}
      >
        {slides.map(s => (
          <SwiperSlide key={s.id}>
            <Link href={`/car/${s.id}`} className="block w-full h-full">
              <div className="relative w-full h-full">
                <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex items-end justify-between gap-4">
                  <div>
          <div className="text-2xl sm:text-3xl font-bold">{s.title}</div>
          <div className="text-xs text-gray-300 mt-0.5">{s.year}</div>
                  </div>
                  <div className="text-right">
          <div className="text-amber-300 font-bold text-lg sm:text-xl">{formatINR(s.priceINR)}</div>
          <div className="text-[11px] text-gray-300 mt-0.5">{formatUSD(s.priceUSD)}</div>
                  </div>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
