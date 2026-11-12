'use client';

import { useEffect, useRef, useState } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const defaultBanners = [
  { src: "/images/banner-1.webp", alt: "دروع وهدايا زمام الجودة" },
  { src: "/images/banner-2.webp", alt: "هدايا دعائية من زمام الجودة" },
  { src: "/images/banner-3.webp", alt: "منتجات زمام الجودة" },
];

export default function Banner() {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [banners, setBanners] = useState(defaultBanners);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetch(`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api")}/banners`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (Array.isArray(data?.banners)) setBanners(data.banners); })
      .catch(() => {});
  }, []);

  return (
    <section aria-label="عروض زمام الجودة" className="mx-auto w-[94%] max-w-[1200px] py-3 sm:w-[88%] sm:py-4 lg:w-[75%]">
      {isMounted && banners.length > 0 && <Swiper
        dir="rtl"
        modules={[Autoplay]}
        autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        loop
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="alzmam-banner-swiper overflow-hidden rounded-md"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.src}>
            <img
              src={banner.src}
              alt={banner.alt}
              className="block aspect-[16/5] w-full rounded-md object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>}
      {banners.length > 1 && <div className="mt-3 flex items-center justify-center gap-2" aria-label="اختيار صورة العرض">
        {banners.map((banner, index) => (
          <button
            key={banner.src}
            type="button"
            aria-label={`العرض ${index + 1}`}
            aria-current={activeIndex === index ? "true" : undefined}
            onClick={() => swiperRef.current?.slideToLoop(index)}
            className={`h-1.5 cursor-pointer rounded-full transition-all ${
              activeIndex === index ? "w-9 bg-gray-700" : "w-6 bg-gray-300 hover:bg-gray-500"
            }`}
          />
        ))}
      </div>}
    </section>
  );
}
