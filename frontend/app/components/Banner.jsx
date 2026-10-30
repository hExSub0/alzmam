'use client';

import { useRef, useState } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const banners = [
  { src: "/images/banner-1.webp", alt: "دروع وهدايا بالميرا" },
  { src: "/images/banner-2.webp", alt: "هدايا دعائية من بالميرا" },
  { src: "/images/banner-3.webp", alt: "منتجات بالميرا" },
];

export default function Banner() {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section aria-label="عروض بالميرا" className="mx-auto w-[75%] max-w-[1200px] py-4">
      <Swiper
        dir="rtl"
        modules={[Autoplay]}
        autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        loop
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="palmera-banner-swiper overflow-hidden rounded-md"
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
      </Swiper>
      <div className="mt-3 flex items-center justify-center gap-2" aria-label="اختيار صورة العرض">
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
      </div>
    </section>
  );
}
