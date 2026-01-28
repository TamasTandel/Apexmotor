"use client";
import { useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

export default function GalleryClient({ primaryImage, images = [], videos = [], minSlides = 3 }) {
  // Build a unified media array: images first, then videos
  const media = useMemo(() => {
    const imgs = [];
    if (primaryImage) imgs.push({ type: 'image', src: primaryImage });
    for (const src of images) if (src) imgs.push({ type: 'image', src });
    for (const v of videos) if (v && v.src) imgs.push({ type: 'video', src: v.src, poster: v.poster });
    // Ensure a minimum number of slides with placeholders for demo/testing
    const need = Math.max(0, (minSlides || 0) - imgs.length);
    for (let i = 0; i < need; i++) {
      const w = 1200, h = 600;
      const text = encodeURIComponent(`Placeholder ${i + 1}`);
      const url = `https://placehold.co/${w}x${h}?text=${text}`;
      imgs.push({ type: 'image', src: url, placeholder: true });
    }
    return imgs;
  }, [primaryImage, images, videos, minSlides]);

  if (!media.length) return null;

  return (
    <div className="relative">
      <Swiper
        className="rounded-lg border border-gray-700 bg-gray-800"
        modules={[Navigation, Pagination, FreeMode, Thumbs]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={12}
        slidesPerView={1}
        style={{ '--swiper-theme-color': '#60a5fa' }}
      >
        {media.map((m, idx) => (
          <SwiperSlide key={idx}>
            {m.type === 'image' ? (
              <img src={m.src} alt={m.placeholder ? `placeholder-${idx}` : `media-${idx}`} className="w-full h-[380px] sm:h-[440px] object-cover" />
            ) : (
              <video
                className="w-full h-[380px] sm:h-[440px] object-cover bg-black"
                src={m.src}
                poster={m.poster}
                controls
              />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
